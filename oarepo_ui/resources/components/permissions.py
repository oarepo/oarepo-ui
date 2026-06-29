#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Component that exposes record-related permissions to templates and forms.

Populates extra_context, render_kwargs and search options with boolean flags
indicating which record actions are allowed for the current identity and record
state. A single global action set is used for both drafts and published records
so the resulting ``can_*`` dict has the same shape everywhere.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, override

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
        self.fill_permissions(self._get_underlying_record(api_record), extra_context, identity)
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
            except Exception:  # noqa
                can_perform = False
            ret[f"can_{mapped_to}"] = can_perform
        return ret

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
