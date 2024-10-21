from typing import Dict

from flask_principal import Identity
from invenio_records_resources.services.records.results import RecordItem

from oarepo_ui.resources.components import UIResourceComponent


class CustomFieldsComponent(UIResourceComponent):
    def form_config(
        self,
        *,
        api_record: RecordItem = None,
        record: Dict = None,
        data: Dict = None,
        identity: Identity,
        form_config: Dict,
        args: Dict,
        view_args: Dict,
        ui_links: Dict = None,
        extra_context: Dict = None,
        **kwargs,
    ):
        if hasattr(self.resource.config, "custom_fields"):
            form_config["custom_fields"] = self.resource.config.custom_fields(
                identity=identity,
                api_record=api_record,
                record=record,
                data=data,
                form_config=form_config,
                args=args,
                view_args=view_args,
                ui_links=ui_links,
                extra_context=extra_context,
            )
