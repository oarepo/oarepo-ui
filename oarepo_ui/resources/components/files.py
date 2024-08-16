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
        files = file_service.list_files(identity, api_record["id"])
        extra_context["files"] = files.to_dict()

    def before_ui_detail(self, **kwargs):
        self.before_ui_edit(**kwargs)
