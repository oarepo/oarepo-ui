import inspect
from pathlib import Path

from flask_resources import ResponseHandler, JSONSerializer
from invenio_records_resources.resources import (
    RecordResourceConfig as InvenioRecordResourceConfig,
)

from oarepo_ui.proxies import current_oarepo_ui
from flask_resources import (
    ResourceConfig,
)

from invenio_base.utils import obj_or_import_string

import marshmallow as ma


def _(x):
    """Identity function used to trigger string extraction."""
    return x


class UIResourceConfig(ResourceConfig):
    components = None
    template_folder = None

    def get_template_folder(self):
        if not self.template_folder:
            return None

        tf = Path(self.template_folder)
        if not tf.is_absolute():
            tf = (
                Path(inspect.getfile(type(self)))
                .parent.absolute()
                .joinpath(tf)
                .absolute()
            )
        return str(tf)

    response_handlers = {"text/html": None}
    default_accept_mimetype = "text/html"

    # Request parsing
    request_read_args = {}
    request_view_args = {}


class RecordsUIResourceConfig(UIResourceConfig):
    routes = {
        "search": "",
        "detail": "/<pid_value>",
        "export": "/<pid_value>/export/<export_format>",
    }
    request_view_args = {"pid_value": ma.fields.Str()}
    request_export_args = {"export_format": ma.fields.Str()}

    app_contexts = None
    ui_serializer = None
    ui_serializer_class = None
    api_service = None
    templates = {
        "detail": {
            "layout": "add-your-own-detail-template-to-site-or-ui-application.html.jinja2",
            "blocks": {},
        },
        "search": {
            "layout": "add-your-own-search-template-to-site-or-ui-application.html.jinja2"
        },
        "edit": {
            "layout": "add-your-own-edit-template-to-site-or-ui-application.html.jinja2"
        },
    }
    layout = "sample"

    @property
    def exports(self):
        return {
            "json": {
                "name": _("JSON"),
                "serializer": ("flask_resources.serializers:JSONSerializer"),
                "content-type": "application/json",
                "filename": "{id}.json",
            },
        }

    @property
    def ui_serializer(self):
        return obj_or_import_string(self.ui_serializer_class)()
