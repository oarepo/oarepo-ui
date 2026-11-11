# SPDX-FileCopyrightText: 2025-2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Component that adds file transfer settings to the deposit form config.

The files quota (``form_config["quota"]``) is computed by the records UI resource itself
(see :func:`oarepo_ui.resources.utils.get_form_files_quota`), so it is present regardless of
whether this component is configured.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, override

from flask import current_app
from invenio_rdm_records.views import file_transfer_type
from invenio_records_resources.proxies import current_transfer_registry

from oarepo_ui.resources.components import UIResourceComponent

from ..records.config import RecordsUIResourceConfig

if TYPE_CHECKING:
    from flask_principal import Identity
    from invenio_records_resources.services.records.results import RecordItem


class FilesQuotaAndTransferComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Provide file transfer settings for the deposit form.

    Files quota is no longer set here: the resource builds ``form_config["quota"]`` in the
    upstream shape for create and edit, so the former ``before_ui_create``/``before_ui_edit``
    hooks (which recomputed it) were removed. Subclasses overriding those hooks and calling
    ``super()`` keep working (the base no-op is inherited).
    """

    @override
    def form_config(
        self,
        *,
        api_record: RecordItem | None = None,
        record: dict | None = None,
        identity: Identity,
        form_config: dict,
        ui_links: dict | None = None,
        extra_context: dict | None = None,
        **_kwargs: Any,
    ) -> None:
        """Put transfer types in form config if configured on the resource.

        :param api_record: API record being edited, or None when creating.
        :param record: UI-serialized record dictionary, or None when creating.
        :param identity: Current user identity.
        :param form_config: Form configuration dictionary to mutate in-place.
        :param ui_links: Optional UI links dictionary.
        :param extra_context: Optional extra context dictionary.
        """
        form_config["default_transfer_type"] = current_transfer_registry.default_transfer_type
        form_config["enabled_transfer_types"] = list(current_transfer_registry.get_transfer_types())
        form_config["transfer_types"] = file_transfer_type()["transfer_types"]
        form_config["decimal_size_display"] = current_app.config.get("APP_RDM_DISPLAY_DECIMAL_FILE_SIZES", True)
        form_config["allowEmptyFiles"] = current_app.config.get("RECORDS_RESOURCES_ALLOW_EMPTY_FILES", False)
