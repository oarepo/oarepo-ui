from flask import g, render_template
from flask_resources import Resource, route, resource_requestctx
from invenio_records_resources.resources import (
    RecordResourceConfig,
)
from invenio_records_resources.resources.records.resource import (
    request_read_args,
    request_view_args,
)
from invenio_records_resources.services import RecordService

from .config import UIResourceConfig, RecordsUIResourceConfig

from invenio_records_resources.proxies import current_service_registry

#
# Resource
#
from ..proxies import current_oarepo_ui


class UIResource(Resource):
    """Record resource."""

    config: UIResourceConfig

    def __init__(self, config=None):
        """Constructor."""
        super(UIResource, self).__init__(config)

    def as_blueprint(self, **options):
        if "template_folder" not in options:
            template_folder = self.config.get_template_folder()
            if template_folder:
                options["template_folder"] = template_folder
        return super().as_blueprint(**options)

    #
    # Pluggable components
    #
    @property
    def components(self):
        """Return initialized service components."""
        return (c(self) for c in self.config.components or [])

    def run_components(self, action, *args, **kwargs):
        """Run components for a given action."""

        for component in self.components:
            if hasattr(component, action):
                getattr(component, action)(*args, **kwargs)


class RecordsUIResource(UIResource):
    config: RecordsUIResourceConfig
    api_config: RecordResourceConfig
    service: RecordService

    def __init__(self, config=None):
        """Constructor."""
        super(UIResource, self).__init__(config)

    def create_url_rules(self):
        """Create the URL rules for the record resource."""
        routes = self.config.routes
        return [
            route("GET", routes["detail"], self.detail),
        ]

    def as_blueprint(self, **options):
        blueprint = super().as_blueprint(**options)
        blueprint.app_context_processor(lambda: self.register_context_processor())
        return blueprint

    def register_context_processor(self):
        """function providing flask template app context processors"""
        ret = {}
        self.run_components("register_context_processor", context_processors=ret)
        return ret

    @request_read_args
    @request_view_args
    def detail(self):
        """Returns item detail page."""
        record = self._api_service.read(
            g.identity, resource_requestctx.view_args["pid_value"]
        )
        # TODO: handle permissions UI way - better response than generic error
        serialized_record = self.config.ui_serializer.dump_obj(record.to_dict())
        layout = current_oarepo_ui.get_layout(self.get_layout_name())
        self.run_components(
            "before_ui_detail",
            layout=layout,
            resource=self,
            record=serialized_record,
            identity=g.identity,
        )
        template_def = self.get_template_def("detail")
        template = current_oarepo_ui.get_template(
            template_def["layout"],
            template_def["blocks"],
        )
        return render_template(
            template,
            record=serialized_record,
            data=serialized_record,
            metadata=serialized_record.get("metadata", serialized_record),
            ui=serialized_record.get("ui", serialized_record),
            layout=layout,
            component_key="detail",
        )

    def get_layout_name(self):
        return self.config.layout

    def get_template_def(self, template_type):
        return self.config.templates[template_type]

    @property
    def _api_service(self):
        print(current_service_registry._services.keys())
        return current_service_registry.get(self.config.api_service)
