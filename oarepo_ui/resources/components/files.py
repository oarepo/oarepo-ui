from invenio_previewer import current_previewer
from invenio_records_resources.services.errors import PermissionDeniedError
from oarepo_runtime.datastreams.utils import get_file_service_for_record_service

from .base import UIResourceComponent


class FilesComponent(UIResourceComponent):
    def before_ui_edit(self, *, api_record, extra_context, identity, **kwargs):
        from ..resource import RecordsUIResource

        if not isinstance(self.resource, RecordsUIResource):
            return

        file_service = get_file_service_for_record_service(
            self.resource.api_service, record=api_record
        )
        try:
            files = file_service.list_files(identity, api_record["id"])
            files_dict = files.to_dict()
            files_dict["entries"] = [
                {
                    **file_entry,
                    "previewable": file_entry["key"].lower().split(".")[-1]
                    in current_previewer.previewable_extensions,
                }
                for file_entry in files_dict.get("entries", [])
            ]
            extra_context["files"] = files_dict
        except PermissionDeniedError:
            extra_context["files"] = {"entries": [], "links": {}}

    def before_ui_detail(self, **kwargs):
        self.before_ui_edit(**kwargs)
