from flask import g, render_template
from flask_resources import Resource, route, resource_requestctx
from invenio_records_resources.resources import (
    RecordResourceConfig,
)
from invenio_records_resources.resources.records.resource import request_read_args, request_view_args
from invenio_records_resources.services import RecordService

from .config import UIResourceConfig, RecordsUIResourceConfig

#
# Resource
#
from .templating import render_template_with_macros


class UIResource(Resource):
    """Record resource."""
    config: UIResourceConfig

    def __init__(self, config=None):
        """Constructor."""
        super(UIResource, self).__init__(config)

    def as_blueprint(self, **options):
        if 'template_folder' not in options:
            template_folder = self.config.get_template_folder()
            if template_folder:
                options['template_folder'] = template_folder
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

    def __init__(self, config=None, api_config=None, service=None):
        """Constructor."""
        super(UIResource, self).__init__(config)
        self.api_config = api_config
        self.service = service

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
        self.run_components('register_context_processor', context_processors=ret)
        return ret

    @request_read_args
    @request_view_args
    def detail(self):
        """Read an item."""
        record = self.service.read(g.identity, resource_requestctx.view_args["pid_value"])

        layout = self.config.layouts['detail']
        self.run_components('before_ui_detail', layout=layout, resource=self, record=record, identity=g.identity)

        return render_template_with_macros(
            self.config.detail_template,
            record=record,
            data=record['metadata'],
            layout=layout
        )
