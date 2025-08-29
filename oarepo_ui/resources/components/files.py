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

from typing import TYPE_CHECKING, Any, override

from invenio_previewer import current_previewer
from invenio_records_resources.services.errors import PermissionDeniedError
from oarepo_runtime import current_runtime

from oarepo_ui.resources.components import UIResourceComponent

from ..records.config import RecordsUIResourceConfig

if TYPE_CHECKING:
    from flask_principal import Identity
    from invenio_records_resources.services.records.results import RecordItem


class FilesComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Provide file metadata to be rendered on detail and edit pages."""

    @override
    def before_ui_edit(
        self,
        *,
        api_record: RecordItem,
        identity: Identity,
        extra_context: dict,
        **kwargs: Any,
    ) -> None:
        """Attach files list to extra_context prior to rendering the edit page.

        Retrieves the file service for the record service, lists files for the
        given record and marks each file entry with a "previewable" boolean based
        on its extension and the configured previewer.

        :param api_record: API record or wrapper containing the record identifier.
        :param extra_context: Context dictionary to be mutated in-place.
        :param identity: Current user identity used for permission checks.
        :raises PermissionDeniedError: If the identity is not allowed to list files.
        """
        from ..records.resource import RecordsUIResource

        if not isinstance(self.resource, RecordsUIResource):
            return

        file_service = current_runtime.get_file_service_for_record(api_record._record)  # noqa: SLF001
        if not file_service:
            return
        try:
            files = file_service.list_files(identity, api_record["id"])
            files_dict = files.to_dict()
            files_dict["entries"] = [
                {
                    **file_entry,
                    "previewable": file_entry["key"].lower().split(".")[-1] in current_previewer.previewable_extensions,
                }
                for file_entry in files_dict.get("entries", [])
            ]
            extra_context["files"] = files_dict
        except PermissionDeniedError:
            extra_context["files"] = {"entries": [], "links": {}}

    def before_ui_detail(self, **kwargs: Any) -> None:
        """Populate files for the detail page using the same logic as edit.

        Delegates to ``before_ui_edit`` to avoid code duplication.
        :raises: Same as ``before_ui_edit``
        """
        self.before_ui_edit(**kwargs)
