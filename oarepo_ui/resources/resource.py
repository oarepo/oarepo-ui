import copy
from functools import partial

import deepmerge
from flask import abort, g, redirect, request
from flask_resources import (
    Resource,
    from_conf,
    request_parser,
    resource_requestctx,
    route,
)
from flask_security import login_required
from invenio_base.utils import obj_or_import_string
from invenio_records_resources.pagination import Pagination
from invenio_records_resources.proxies import current_service_registry
from invenio_records_resources.records.systemfields import FilesField
from invenio_records_resources.resources.records.resource import (
    request_read_args,
    request_search_args,
    request_view_args,
)
from invenio_records_resources.services import LinksTemplate

from oarepo_ui.utils import dump_empty

#
# Resource
#
from ..proxies import current_oarepo_ui
from .catalog import get_jinja_template
from .config import RecordsUIResourceConfig, UIResourceConfig

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

    def __init__(self, config=None):
        """Constructor."""
        super(UIResource, self).__init__(config)

    def create_url_rules(self):
        """Create the URL rules for the record resource."""
        route_config = self.config.routes
        search_route = route_config["search"]
        if not search_route.endswith("/"):
            search_route += "/"
        search_route_without_slash = search_route[:-1]
        routes = [
            route("GET", route_config["export"], self.export),
            route("GET", route_config["detail"], self.detail),
            route("GET", search_route, self.search),
            route("GET", search_route_without_slash, self.search_without_slash),
        ]
        if "create" in route_config:
            routes += [route("GET", route_config["create"], self.create)]
        if "edit" in route_config:
            routes += [route("GET", route_config["edit"], self.edit)]
        return routes

    def empty_record(self, resource_requestctx, **kwargs):
        """Create an empty record with default values."""
        record = dump_empty(self.api_config.schema)
        files_field = getattr(self.api_config.record_cls, "files", None)
        if files_field and isinstance(files_field, FilesField):
            record["files"] = {"enabled": False}
        record = deepmerge.always_merger.merge(
            record, copy.deepcopy(self.config.empty_record)
        )
        self.run_components(
            "empty_record", resource_requestctx=resource_requestctx, record=record
        )
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
        """Returns item detail page."""
        record = self._get_record(resource_requestctx, allow_draft=False)
        # TODO: handle permissions UI way - better response than generic error
        serialized_record = self.config.ui_serializer.dump_obj(record.to_dict())
        # make links absolute
        if "links" in serialized_record:
            for k, v in list(serialized_record["links"].items()):
                if not isinstance(v, str):
                    continue
                if not v.startswith("/") and not v.startswith("https://"):
                    v = f"/api{self.api_service.config.url_prefix}{v}"
                    serialized_record["links"][k] = v

        export_path = request.path.split("?")[0]
        if not export_path.endswith("/"):
            export_path += "/"
        export_path += "export"

        layout = current_oarepo_ui.get_layout(self.get_layout_name())
        _catalog = current_oarepo_ui.catalog

        template_def = self.get_template_def("detail")
        fields = ["metadata", "ui", "layout", "record", "extra_context"]
        source = get_jinja_template(_catalog, template_def, fields)

        extra_context = dict()
        ui_links = self.expand_detail_links(identity=g.identity, record=record)

        serialized_record["extra_links"] = {
            "ui_links": ui_links,
            "export_path": export_path,
            "search_link": self.config.url_prefix,
        }

        self.run_components(
            "before_ui_detail",
            resource=self,
            record=serialized_record,
            identity=g.identity,
            extra_context=extra_context,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            ui_links=ui_links,
            ui_config=self.config,
            ui_resource=self,
            layout=layout,
            component_key="search",
        )

        metadata = dict(serialized_record.get("metadata", serialized_record))
        return _catalog.render(
            "detail",
            __source=source,
            metadata=metadata,
            ui=dict(serialized_record.get("ui", serialized_record)),
            layout=dict(layout),
            record=serialized_record,
            extra_context=extra_context,
            ui_links=ui_links,
        )

    def _get_record(self, resource_requestctx, allow_draft=False):
        if allow_draft:
            read_method = (
                getattr(self.api_service, "read_draft") or self.api_service.read
            )
        else:
            read_method = self.api_service.read

        return read_method(g.identity, resource_requestctx.view_args["pid_value"])

    def search_without_slash(self):
        split_path = request.full_path.split("?", maxsplit=1)
        path_with_slash = split_path[0] + "/"
        if len(split_path) == 1:
            return redirect(path_with_slash, code=302)
        else:
            return redirect(path_with_slash + "?" + split_path[1], code=302)

    @request_search_args
    def search(self):
        _catalog = current_oarepo_ui.catalog

        template_def = self.get_template_def("search")
        app_id = template_def["app_id"]
        fields = [
            "search_app_config",
            "ui_layout",
            "layout",
            "ui_links",
            "extra_content",
        ]
        source = get_jinja_template(_catalog, template_def, fields)

        layout = current_oarepo_ui.get_layout(self.get_layout_name())

        page = resource_requestctx.args.get("page", 1)
        size = resource_requestctx.args.get("size", 10)
        pagination = Pagination(
            size,
            page,
            # we should present all links
            # (but do not want to get the count as it is another request to Opensearch)
            (page + 1) * size,
        )
        ui_links = self.expand_search_links(
            g.identity, pagination, resource_requestctx.args
        )

        search_options = dict(
            api_config=self.api_service.config,
            identity=g.identity,
            overrides={"ui_endpoint": self.config.url_prefix, "ui_links": ui_links},
        )

        extra_context = dict()
        links = self.expand_search_links(
            g.identity, pagination, resource_requestctx.args
        )

        self.run_components(
            "before_ui_search",
            resource=self,
            identity=g.identity,
            search_options=search_options,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            ui_config=self.config,
            ui_resource=self,
            ui_links=ui_links,
            layout=layout,
            component_key="search",
            extra_context=extra_context,
        )

        search_config = partial(self.config.search_app_config, **search_options)

        search_app_config = search_config(app_id=app_id)

        return _catalog.render(
            "search",
            __source=source,
            search_app_config=search_app_config,
            ui_config=self.config,
            ui_resource=self,
            layout=layout,
            ui_links=ui_links,
            extra_context=extra_context,
        )

    @request_read_args
    @request_view_args
    @request_export_args
    def export(self):
        pid_value = resource_requestctx.view_args["pid_value"]
        export_format = resource_requestctx.view_args["export_format"]
        record = self._get_record(resource_requestctx, allow_draft=False)

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

    @login_required
    @request_read_args
    @request_view_args
    def edit(self):
        record = self._get_record(resource_requestctx, allow_draft=True)
        data = record.to_dict()
        serialized_record = self.config.ui_serializer.dump_obj(record.to_dict())
        layout = current_oarepo_ui.get_layout(self.get_layout_name())
        form_config = self.config.form_config(
            identity=g.identity, updateUrl=record.links.get("self", None)
        )

        ui_links = self.expand_detail_links(identity=g.identity, record=record)

        extra_context = dict()

        self.run_components(
            "form_config",
            layout=layout,
            resource=self,
            record=record,
            data=record,
            form_config=form_config,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            identity=g.identity,
            ui_links=ui_links,
            extra_context=extra_context,
        )
        self.run_components(
            "before_ui_edit",
            layout=layout,
            resource=self,
            record=serialized_record,
            data=data,
            form_config=form_config,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            ui_links=ui_links,
            identity=g.identity,
            extra_context=extra_context,
        )
        template_def = self.get_template_def("edit")
        _catalog = current_oarepo_ui.catalog
        source = get_jinja_template(
            _catalog, template_def, ["record", "extra_context", "form_config", "data"]
        )
        serialized_record["extra_links"] = {
            "ui_links": ui_links,
            "search_link": self.config.url_prefix,
        }

        return _catalog.render(
            "edit",
            __source=source,
            record=serialized_record,
            form_config=form_config,
            extra_context=extra_context,
            ui_links=ui_links,
            data=data,
        )

    @login_required
    @request_read_args
    @request_view_args
    def create(self):
        empty_record = self.empty_record(resource_requestctx)
        layout = current_oarepo_ui.get_layout(self.get_layout_name())
        form_config = self.config.form_config(
            identity=g.identity,
            # TODO: use api service create link when available
            createUrl=f"/api{self.api_service.config.url_prefix}",
        )
        extra_context = dict()

        self.run_components(
            "form_config",
            layout=layout,
            resource=self,
            record=empty_record,
            data=empty_record,
            form_config=form_config,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            identity=g.identity,
            extra_context=extra_context,
        )
        self.run_components(
            "before_ui_create",
            layout=layout,
            resource=self,
            record=empty_record,
            data=empty_record,
            form_config=form_config,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            identity=g.identity,
            extra_context=extra_context,
        )
        template_def = self.get_template_def("create")
        _catalog = current_oarepo_ui.catalog

        source = get_jinja_template(
            _catalog, template_def, ["record", "extra_context", "form_config", "data"]
        )

        return _catalog.render(
            "create",
            __source=source,
            record=empty_record,
            form_config=form_config,
            extra_context=extra_context,
            ui_links={},
            data=empty_record,
        )

    @property
    def api_service(self):
        return current_service_registry.get(self.config.api_service)

    @property
    def api_config(self):
        return self.api_service.config

    def expand_detail_links(self, identity, record):
        """Get links for this result item."""
        tpl = LinksTemplate(
            self.config.ui_links_item, {"url_prefix": self.config.url_prefix}
        )
        return tpl.expand(identity, record)

    def expand_search_links(self, identity, pagination, args):
        """Get links for this result item."""
        tpl = LinksTemplate(
            self.config.ui_links_search,
            {"config": self.config, "url_prefix": self.config.url_prefix, "args": args},
        )
        return tpl.expand(identity, pagination)
