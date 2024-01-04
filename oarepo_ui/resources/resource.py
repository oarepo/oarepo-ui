import copy
from functools import partial
from typing import TYPE_CHECKING, Iterator

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

if TYPE_CHECKING:
    from .components import UIResourceComponent

#
# Resource
#
from ..proxies import current_oarepo_ui
from .config import RecordsUIResourceConfig, UIResourceConfig, TemplatePageUIResourceConfig

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
        blueprint = super().as_blueprint(**options)
        blueprint.app_context_processor(lambda: self.fill_jinja_context())
        return blueprint

    #
    # Pluggable components
    #
    @property
    def components(self) -> Iterator["UIResourceComponent"]:
        """Return initialized service components."""
        return (c(self) for c in self.config.components or [])

    def run_components(self, action, *args, **kwargs):
        """Run components for a given action."""

        for component in self.components:
            if hasattr(component, action):
                getattr(component, action)(*args, **kwargs)

    def fill_jinja_context(self):
        """function providing flask template app context processors"""
        ret = {}
        self.run_components("fill_jinja_context", context=ret)
        return ret


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
        empty_data = dump_empty(self.api_config.schema)
        files_field = getattr(self.api_config.record_cls, "files", None)
        if files_field and isinstance(files_field, FilesField):
            empty_data["files"] = {"enabled": False}
        empty_data = deepmerge.always_merger.merge(
            empty_data, copy.deepcopy(self.config.empty_record)
        )
        self.run_components(
            "empty_record",
            resource_requestctx=resource_requestctx,
            empty_data=empty_data,
        )
        return empty_data

    @request_read_args
    @request_view_args
    def detail(self):
        """Returns item detail page."""

        api_record = self._get_record(resource_requestctx, allow_draft=False)

        # TODO: handle permissions UI way - better response than generic error
        record = self.config.ui_serializer.dump_obj(api_record.to_dict())
        record.setdefault("links", {})

        ui_links = self.expand_detail_links(identity=g.identity, record=api_record)
        export_path = request.path.split("?")[0]
        if not export_path.endswith("/"):
            export_path += "/"
        export_path += "export"

        record["links"].update(
            {
                "ui_links": ui_links,
                "export_path": export_path,
                "search_link": self.config.url_prefix,
            }
        )

        self.make_links_absolute(record["links"], self.api_service.config.url_prefix)

        extra_context = dict()

        self.run_components(
            "before_ui_detail",
            api_record=api_record,
            record=record,
            identity=g.identity,
            extra_context=extra_context,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            ui_links=ui_links,
        )
        metadata = dict(record.get("metadata", record))
        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "detail",
                identity=g.identity,
                args=resource_requestctx.args,
                view_args=resource_requestctx.view_args,
            ),
            metadata=metadata,
            ui=dict(record.get("ui", record)),
            record=record,
            api_record=api_record,
            extra_context=extra_context,
            ui_links=ui_links,
        )

    def make_links_absolute(self, links, api_prefix):
        # make links absolute
        for k, v in list(links.items()):
            if not isinstance(v, str):
                continue
            if not v.startswith("/") and not v.startswith("https://"):
                v = f"/api{api_prefix}{v}"
                links[k] = v

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

        self.run_components(
            "before_ui_search",
            identity=g.identity,
            search_options=search_options,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            ui_config=self.config,
            ui_links=ui_links,
            extra_context=extra_context,
        )

        search_config = partial(self.config.search_app_config, **search_options)

        search_app_config = search_config(app_id=self.config.search_app_id)

        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "search",
                identity=g.identity,
                args=resource_requestctx.args,
                view_args=resource_requestctx.view_args,
            ),
            search_app_config=search_app_config,
            ui_config=self.config,
            ui_resource=self,
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

    def get_jinjax_macro(self, template_type, identity=None, args=None, view_args=None):
        """
        Returns which jinjax macro (name of the macro, including optional namespace in the form of "namespace.Macro")
        should be used for rendering the template.
        """
        return self.config.templates[template_type]

    @login_required
    @request_read_args
    @request_view_args
    def edit(self):
        api_record = self._get_record(resource_requestctx, allow_draft=True)
        self.api_service.require_permission(g.identity, "update", record=api_record)
        data = api_record.to_dict()
        record = self.config.ui_serializer.dump_obj(api_record.to_dict())
        form_config = self.config.form_config(
            identity=g.identity, updateUrl=api_record.links.get("self", None)
        )

        ui_links = self.expand_detail_links(identity=g.identity, record=api_record)

        extra_context = dict()

        self.run_components(
            "form_config",
            api_record=api_record,
            data=data,
            record=record,
            identity=g.identity,
            form_config=form_config,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            ui_links=ui_links,
            extra_context=extra_context,
        )
        self.run_components(
            "before_ui_edit",
            api_record=api_record,
            record=record,
            data=data,
            form_config=form_config,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            ui_links=ui_links,
            identity=g.identity,
            extra_context=extra_context,
        )

        record["extra_links"] = {
            "ui_links": ui_links,
            "search_link": self.config.url_prefix,
        }

        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "edit",
                identity=g.identity,
                args=resource_requestctx.args,
                view_args=resource_requestctx.view_args,
            ),
            record=record,
            api_record=api_record,
            form_config=form_config,
            extra_context=extra_context,
            ui_links=ui_links,
            data=data,
        )

    @login_required
    @request_read_args
    @request_view_args
    def create(self):
        self.api_service.require_permission(g.identity, "create", record=None)
        empty_record = self.empty_record(resource_requestctx)
        form_config = self.config.form_config(
            identity=g.identity,
            # TODO: use api service create link when available
            createUrl=f"/api{self.api_service.config.url_prefix}",
        )
        extra_context = dict()

        ui_links = {}

        self.run_components(
            "form_config",
            api_record=None,
            record=None,
            data=empty_record,
            form_config=form_config,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            identity=g.identity,
            extra_context=extra_context,
            ui_links=ui_links,
        )
        self.run_components(
            "before_ui_create",
            data=empty_record,
            record=None,
            api_record=None,
            form_config=form_config,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            identity=g.identity,
            extra_context=extra_context,
            ui_links=ui_links,
        )

        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "create",
                identity=g.identity,
                args=resource_requestctx.args,
                view_args=resource_requestctx.view_args,
            ),
            record=empty_record,
            api_record=None,
            form_config=form_config,
            extra_context=extra_context,
            ui_links=ui_links,
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


class TemplatePageUIResource(UIResource):

    def create_url_rules(self):
        """Create the URL rules for the record resource."""
        self.config: TemplatePageUIResourceConfig

        pages_config = self.config.pages
        routes = []
        for page_url_path, page_template_name in pages_config.items():
            handler = getattr(self, f"render_{page_template_name}", None) or partial(self.render, page=page_template_name)
            if not hasattr(handler, '__name__'):
                handler.__name__ = self.render.__name__
            if not hasattr(handler, '__self__'):
                handler.__self__ = self

            routes.append(
                route("GET", page_url_path, handler),
            )
        return routes

    @request_view_args
    def render(self, page, *args, **kwargs):
        extra_context = dict()

        self.run_components(
            "before_render",
            identity=g.identity,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            ui_config=self.config,
            extra_context=extra_context,
            page=page,
        )

        return current_oarepo_ui.catalog.render(
            page,
            **kwargs,
            ui_config=self.config,
            ui_resource=self,
            extra_context=extra_context,
        )
