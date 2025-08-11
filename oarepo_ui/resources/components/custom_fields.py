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
        identity: Identity,
        form_config: Dict,
        ui_links: Dict = None,
        extra_context: Dict = None,
        **kwargs,
    ):
        if hasattr(self.resource.config, "custom_fields"):
            form_config["custom_fields"] = self.resource.config.custom_fields(
                identity=identity,
                api_record=api_record,
                record=record,
                form_config=form_config,
                ui_links=ui_links,
                extra_context=extra_context,
            )
