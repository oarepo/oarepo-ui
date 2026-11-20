# SPDX-FileCopyrightText: 2024-2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Component that exposes record-related permissions to templates and forms.

Populates extra_context, render_kwargs and search options with boolean flags
indicating which record actions are allowed for the current identity and record
state. A single global action set is used for both drafts and published records
so the resulting ``can_*`` dict has the same shape everywhere.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, override

from invenio_rdm_records.services.services import RDMRecordService
from oarepo_runtime.typing import record_from_result

from oarepo_ui.resources.components import UIResourceComponent

from ...proxies import current_oarepo_ui
from ..records.config import RecordsUIResourceConfig

if TYPE_CHECKING:
    from flask_principal import Identity
    from invenio_records_resources.records.api import Record
    from invenio_records_resources.services.records.results import RecordItem
    from invenio_records_resources.services.records.service import RecordService


class PermissionsComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Compute and attach permission flags for UI templates and forms."""

    remove_default_community_allowed: bool = False
    """Whether the record's default (primary) community may appear in ``removable_community_ids``.

    oarepo-communities never removes the primary community (it is only migrated), so the default
    is False. Set to True in a subclass to get upstream InvenioRDM behaviour.
    """

    def _get_underlying_record(self, api_record: RecordItem | None) -> Record | None:
        """Extract the underlying record from the RecordItem wrapper."""
        if not api_record:
            return None
        return record_from_result(api_record)

    @override
    def before_ui_detail(
        self,
        *,
        api_record: RecordItem,
        identity: Identity,
        extra_context: dict[str, Any],
        render_kwargs: dict[str, Any],
        **kwargs: Any,
    ) -> None:
        """Attach permissions before rendering the detail page."""
        from ..records.resource import RecordsUIResource

        record = self._get_underlying_record(api_record)
        self.fill_permissions(record, extra_context, identity)
        if isinstance(self.resource, RecordsUIResource):
            extra_context["permissions"]["removable_community_ids"] = self.get_removable_community_ids(
                self.resource.api_service, identity, record
            )
        render_kwargs["permissions"] = extra_context["permissions"]

    @override
    def before_ui_edit(
        self,
        *,
        api_record: RecordItem,
        identity: Identity,
        extra_context: dict[str, Any],
        render_kwargs: dict[str, Any],
        **kwargs: Any,
    ) -> None:
        """Attach permissions before rendering the edit page."""
        self.fill_permissions(self._get_underlying_record(api_record), extra_context, identity)
        render_kwargs["permissions"] = extra_context["permissions"]

    @override
    def before_ui_create(
        self,
        *,
        identity: Identity,
        extra_context: dict[str, Any],
        render_kwargs: dict[str, Any],
        **kwargs: Any,
    ) -> None:
        """Attach permissions for creating a new record."""
        self.fill_permissions(None, extra_context, identity)
        render_kwargs["permissions"] = extra_context["permissions"]

    @override
    def before_ui_search(
        self,
        *,
        identity: Identity,
        extra_context: dict[str, Any],
        search_options: dict[str, Any],
        **kwargs: Any,
    ) -> None:
        """Attach permissions for the search page and propagate to search options."""
        from ..records.resource import RecordsUIResource

        if not isinstance(self.resource, RecordsUIResource):
            return

        extra_context["permissions"] = {"can_create": self.resource.has_deposit_permissions(identity)}
        # fixes issue with permissions not propagating down to template
        search_options["overrides"]["permissions"] = extra_context["permissions"]

    def get_record_permissions(
        self,
        actions: dict[str, str],
        service: RecordService,
        identity: Identity,
        record: dict | None,
        **kwargs: Any,
    ) -> dict[str, bool]:
        """Generate (default) record action permissions.

        :param actions: Mapping of service action name to UI flag suffix.
        :param service: The underlying API service used to check permissions.
        :param identity: Current user identity.
        :param record: Underlying record or draft, or empty dict if not present.
        :returns: A dict of permission flags, e.g. {"can_read": True}.
        """
        ret: dict[str, bool] = {}
        for action_name, mapped_to in actions.items():
            try:
                can_perform = service.check_permission(identity, action_name, record=record or {}, **kwargs)
            except Exception:  # noqa: BLE001
                can_perform = False
            ret[f"can_{mapped_to}"] = can_perform
        return ret

    def get_removable_community_ids(
        self,
        service: RecordService,
        identity: Identity,
        record: Record | None,
    ) -> list[str]:
        """Return ids of the record's communities the identity may remove the record from.

        Mirrors upstream ``record_detail``: each parent community id is checked against the
        ``remove_community_from_record`` action with ``community_id`` passed to the policy.
        Unlike upstream, the record's default (primary) community is left out unless
        ``remove_default_community_allowed`` is set, because oarepo-communities only allows
        changing the primary community through a migration request.
        Returns an empty list for non-RDM services, records without a parent or parent
        communities, or when the permission check fails.

        :param service: The underlying API service used to check permissions.
        :param identity: Current user identity.
        :param record: Underlying record or draft, or None.
        :returns: List of community ids.
        """
        if record is None or not isinstance(service, RDMRecordService):
            return []
        parent = getattr(record, "parent", None)
        communities = getattr(parent, "communities", None)
        community_ids = getattr(communities, "ids", None)
        if not community_ids:
            return []
        default_id = None if self.remove_default_community_allowed else self._get_default_community_id(communities)
        ret: list[str] = []
        for community_id in community_ids:
            if default_id is not None and str(community_id) == default_id:
                continue
            try:
                allowed = service.check_permission(
                    identity,
                    "remove_community_from_record",
                    record=record,
                    community_id=community_id,
                )
            except Exception:  # noqa: BLE001
                allowed = False
            if allowed:
                ret.append(str(community_id))
        return ret

    def _get_default_community_id(self, communities: Any) -> str | None:
        """Return the default community id of a parent communities field without a database lookup."""
        to_dict = getattr(communities, "to_dict", None)
        if not callable(to_dict):
            return None
        try:
            default_id = to_dict().get("default")
        except Exception:  # noqa: BLE001
            return None
        return str(default_id) if default_id else None

    def fill_permissions(
        self,
        record: Record | None,
        extra_context: dict[str, Any],
        identity: Identity,
        **kwargs: Any,
    ) -> None:
        """Populate extra_context with permission flags using the single global action set."""
        from ..records.resource import RecordsUIResource

        if not isinstance(self.resource, RecordsUIResource):
            return

        actions = current_oarepo_ui.record_actions
        extra_context["permissions"] = self.get_record_permissions(
            actions,
            self.resource.api_service,
            identity,
            record,
            **kwargs,
        )
