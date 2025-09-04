#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Component that fetches file list and previewability for UI templates.

Populates extra_context with record files and flags indicating whether each file
is previewable by the current previewer configuration.
"""

from __future__ import annotations

from copy import deepcopy
from typing import TYPE_CHECKING, Any, override

from flask import current_app
from invenio_app_rdm.records_ui.views.deposits import get_actual_files_quota
from invenio_rdm_records.views import file_transfer_type
from invenio_records_resources.proxies import current_transfer_registry

from oarepo_ui.resources.components import UIResourceComponent

from ..records.config import RecordsUIResourceConfig

if TYPE_CHECKING:
    from flask_principal import Identity
    from invenio_records_resources.services.records.results import RecordItem


class FilesQuotaAndTransferComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Provide file metadata to be rendered on detail and edit pages."""

    @override
    def before_ui_create(
        self,
        *,
        identity: Identity,
        extra_context: dict,
        form_config: dict,
        **kwargs: Any,
    ) -> None:
        """Attach files quotas to form config prior to rendering the create page.

        Retrieves the file service for the record service, lists files for the
        given record and marks each file entry with a "previewable" boolean based
        on its extension and the configured previewer.

        :param api_record: API record or wrapper containing the record identifier.
        :param extra_context: Context dictionary to be mutated in-place.
        :param identity: Current user identity used for permission checks.
        :param form_config: Form configuration dictionary to mutate in-place.
        :raises PermissionDeniedError: If the identity is not allowed to list files.
        """
        quota = deepcopy(current_app.config.get("APP_RDM_DEPOSIT_FORM_QUOTA", {}))
        max_file_size = current_app.config.get("RDM_FILES_DEFAULT_MAX_FILE_SIZE", None)
        record_quota = get_actual_files_quota(None)
        if record_quota:
            quota["maxStorage"] = record_quota["quota_size"]
        form_config["quota"] = dict(**quota, maxFileSize=max_file_size)

    @override
    def before_ui_edit(
        self,
        *,
        api_record: RecordItem,
        identity: Identity,
        extra_context: dict,
        form_config: dict,
        **kwargs: Any,
    ) -> None:
        """Attach files quotas to form config prior to rendering the edit page.

        Retrieves the file service for the record service, lists files for the
        given record and marks each file entry with a "previewable" boolean based
        on its extension and the configured previewer.

        :param api_record: API record or wrapper containing the record identifier.
        :param extra_context: Context dictionary to be mutated in-place.
        :param identity: Current user identity used for permission checks.
        :param form_config: Form configuration dictionary to mutate in-place.
        :raises PermissionDeniedError: If the identity is not allowed to list files.
        """
        quota = deepcopy(current_app.config.get("APP_RDM_DEPOSIT_FORM_QUOTA", {}))
        max_file_size = current_app.config.get("RDM_FILES_DEFAULT_MAX_FILE_SIZE", None)
        record_quota = get_actual_files_quota(api_record._record)  # noqa: SLF001
        if record_quota:
            quota["maxStorage"] = record_quota["quota_size"]
        form_config["quota"] = dict(**quota, maxFileSize=max_file_size)

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
