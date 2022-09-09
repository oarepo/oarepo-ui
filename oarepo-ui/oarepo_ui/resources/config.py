import inspect
from pathlib import Path

from flask_resources import ResponseHandler, JSONSerializer
from invenio_records_resources.resources import (
    RecordResourceConfig as InvenioRecordResourceConfig, )

from oarepo_ui.proxies import current_oarepo_ui


class UIResourceConfig(InvenioRecordResourceConfig):
    components = None
    template_folder = None
    imported_templates = None

    def get_template_folder(self):
        if not self.template_folder:
            return None

        tf = Path(self.template_folder)
        if not tf.is_absolute():
            tf = Path(inspect.getfile(type(self))).parent.absolute().joinpath(tf).absolute()
        return str(tf)

    def get_imported_templates(self):
        if self.imported_templates:
            return self.imported_templates
        return {}


class RecordsUIResourceConfig(UIResourceConfig):
    routes = {
        "search": "",
        "detail": "/<pid_value>",
    }
    detail_template = 'oarepo_ui/generic_detail.html.jinja2'
    app_contexts = None
    ui_serializer_class = None
    layouts = {
        'detail': None
    }

    @property
    def response_handlers(self):
        return {
            "application/json": ResponseHandler(JSONSerializer()),
            "application/vnd.inveniordm.v1+json": ResponseHandler(self.ui_serializer_class()),
        }

    @property
    def components(self):
        return current_oarepo_ui.default_components
