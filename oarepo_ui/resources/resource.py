from functools import partial

from flask import g, render_template, abort, request, redirect
from flask_resources import (
    Resource,
    route,
    resource_requestctx,
    from_conf,
    request_parser,
)
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

from invenio_base.utils import obj_or_import_string

#
# Resource
#
from ..proxies import current_oarepo_ui

request_export_args = request_parser(
    from_conf("request_export_args"), location="view_args"
)


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
        search_route = routes["search"]
        if not search_route.endswith("/"):
            search_route += "/"
        search_route_without_slash = search_route[:-1]
        return [
            route("GET", routes["export"], self.export),
            route("GET", routes["detail"], self.detail),
            route("GET", routes["create"], self.create),
            route("GET", routes["edit"], self.edit),
            route("GET", search_route, self.search),
            route("GET", search_route_without_slash, self.search_without_slash),
        ]

    def new_record(self):
        """Create an empty record with default values."""
        record = dump_empty(self._api_service.config.schema)
        record["files"] = {"enabled": False}
        record["pids"] = {}
        return record

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
        record = self._get_record(resource_requestctx)
        # TODO: handle permissions UI way - better response than generic error
        serialized_record = self.config.ui_serializer.dump_obj(record.to_dict())
        # make links absolute
        if "links" in serialized_record:
            for k, v in list(serialized_record["links"].items()):
                if not isinstance(v, str):
                    continue
                if not v.startswith("/") and not v.startswith("https://"):
                    v = f"/api{self._api_service.config.url_prefix}{v}"
                    serialized_record["links"][k] = v
        layout = current_oarepo_ui.get_layout(self.get_layout_name())
        extra_context = dict()
        self.run_components(
            "before_ui_detail",
            resource=self,
            record=serialized_record,
            identity=g.identity,
            extra_context=extra_context,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            ui_config=self.config,
            ui_resource=self,
            layout=layout,
            component_key="search",
        )

        template_def = self.get_template_def("detail")
        template = current_oarepo_ui.get_template(
            template_def["layout"],
            template_def["blocks"],
        )
        export_path = request.path.split("?")[0]
        if not export_path.endswith("/"):
            export_path += "/"
        export_path += "export"

        return render_template(
            template,
            record=serialized_record,
            data=serialized_record,
            metadata=serialized_record.get("metadata", serialized_record),
            ui=serialized_record.get("ui", serialized_record),
            ui_config=self.config,
            ui_resource=self,
            layout=layout,
            component_key="detail",
            export_path=export_path,
            **extra_context,
        )

    def _get_record(self, resource_requestctx):
        return self._api_service.read(
            g.identity, resource_requestctx.view_args["pid_value"]
        )

    def search_without_slash(self):
        split_path = request.full_path.split("?", maxsplit=1)
        path_with_slash = split_path[0] + "/"
        if len(split_path) == 1:
            return redirect(path_with_slash, code=302)
        else:
            return redirect(path_with_slash + "?" + split_path[1], code=302)

    def search(self):
        template_def = self.get_template_def("search")
        layout = current_oarepo_ui.get_layout(self.get_layout_name())
        template = current_oarepo_ui.get_template(
            template_def["layout"],
            template_def.get("blocks", {}),
        )

        search_options = dict(
            api_config=self._api_service.config,
            identity=g.identity,
        )

        extra_context = dict()

        self.run_components(
            "before_ui_search",
            resource=self,
            identity=g.identity,
            search_options=search_options,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            ui_config=self.config,
            ui_resource=self,
            layout=layout,
            component_key="search",
            extra_context=extra_context,
        )

        search_config = partial(self.config.search_app_config, **search_options)
        return render_template(
            template,
            search_app_config=search_config,
            ui_config=self.config,
            ui_resource=self,
            layout=layout,
            component_key="search",
            **extra_context,
        )

    @request_read_args
    @request_view_args
    @request_export_args
    def export(self):
        pid_value = resource_requestctx.view_args["pid_value"]
        export_format = resource_requestctx.view_args["export_format"]
        record = self._get_record(resource_requestctx)

        exporter = self.config.exports.get(export_format.lower())
        if exporter is None:
            abort(404, f"No exporter for code {{export_format}}")

        serializer = obj_or_import_string(exporter["serializer"])(
            options={
                "indent": 2,
                "sort_keys": True,
            }
        )
        exported_record = serializer.serialize_object(record.to_dict())
        contentType = exporter.get("content-type", export_format)
        filename = exporter.get("filename", export_format).format(id=pid_value)
        headers = {
            "Content-Type": contentType,
            "Content-Disposition": f"attachment; filename={filename}",
        }
        return (exported_record, 200, headers)

    def get_layout_name(self):
        return self.config.layout

    def get_template_def(self, template_type):
        return self.config.templates[template_type]

    # TODO: !IMPORTANT!: must be enabled before any production usage
    # @login_required
    @request_read_args
    @request_view_args
    def edit(self):
        record = self._get_record(resource_requestctx)
        data = record.to_dict()
        serialized_record = self.config.ui_serializer.dump_obj(record.to_dict())
        layout = current_oarepo_ui.get_layout(self.get_layout_name())
        forms_config = (
            self.config.form_config(
                updateUrl=record.links.get("self", None),
            ),
        )

        self.run_components(
            "before_ui_edit",
            layout=layout,
            resource=self,
            record=serialized_record,
            data=data,
            forms_config=forms_config,
            identity=g.identity,
        )
        template_def = self.get_template_def("edit")
        template = current_oarepo_ui.get_template(
            template_def["layout"], template_def.get("blocks", {})
        )

        return render_template(
            template,
            record=serialized_record,
            data=data,
            ui=serialized_record.get("ui", serialized_record),
            ui_config=self.config,
            ui_resource=self,
            forms_config=forms_config,
            layout=layout,
            component_key="edit",
        )

    # TODO: !IMPORTANT!: needs to be enabled before production deployment
    # @login_required
    @request_read_args
    @request_view_args
    def create(self):
        empty_record = self.new_record()
        layout = current_oarepo_ui.get_layout(self.get_layout_name())
        forms_config = self.config.form_config(
            # TODO: use api service create link when available
            createUrl=f"/api{self._api_service.config.url_prefix}",
        )

        self.run_components(
            "before_ui_create",
            layout=layout,
            resource=self,
            record=empty_record,
            data=empty_record,
            forms_config=forms_config,
            identity=g.identity,
        )
        template_def = self.get_template_def("create")
        template = current_oarepo_ui.get_template(
            template_def["layout"], template_def.get("blocks", {})
        )

        return render_template(
            template,
            record=empty_record,
            data=empty_record,
            ui=empty_record.get("ui", empty_record),
            ui_config=self.config,
            ui_resource=self,
            layout=layout,
            component_key="create",
            forms_config=forms_config
        )

    @property
    def _api_service(self):
        return current_service_registry.get(self.config.api_service)
