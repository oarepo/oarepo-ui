import copy

#
import logging
from functools import partial
from mimetypes import guess_extension
from os.path import splitext
from typing import TYPE_CHECKING, Iterator

import deepmerge
from flask import Blueprint, Response, abort, current_app, g, redirect, request
from flask_login import current_user
from flask_principal import PermissionDenied
from flask_resources import (
    Resource,
    from_conf,
    request_parser,
    resource_requestctx,
    route,
)
from flask_security import login_required
from invenio_base.utils import obj_or_import_string
from invenio_previewer import current_previewer
from invenio_previewer.extensions import default as default_previewer
from invenio_rdm_records.services.errors import RecordDeletedException
from invenio_records_resources.pagination import Pagination
from invenio_records_resources.proxies import current_service_registry
from invenio_records_resources.records.systemfields import FilesField
from invenio_records_resources.resources.records.resource import (
    request_read_args,
    request_search_args,
    request_view_args,
)
from invenio_records_resources.services import LinksTemplate
from invenio_records_resources.services.base.config import ConfiguratorMixin
from invenio_stats.proxies import current_stats
from oarepo_runtime.datastreams.utils import get_file_service_for_record_class
from oarepo_runtime.resources.responses import ExportableResponseHandler
from werkzeug.exceptions import Forbidden

from oarepo_ui.utils import dump_empty

# Resource
#
from ..proxies import current_oarepo_ui
from .config import (
    FormConfigResourceConfig,
    RecordsUIResourceConfig,
    TemplatePageUIResourceConfig,
    UIResourceConfig,
)
from .signposting import response_header_signposting
from .templating.data import FieldData

if TYPE_CHECKING:
    from .components import UIResourceComponent


log = logging.getLogger(__name__)

request_export_args = request_parser(
    from_conf("request_export_args"), location="view_args"
)

request_file_view_args = request_parser(
    from_conf("request_file_view_args"), location="view_args"
)

request_create_args = request_parser(from_conf("request_create_args"), location="args")

request_form_config_view_args = request_parser(
    from_conf("request_form_config_view_args"), location="view_args"
)


class UIComponentsMixin:
    #
    # Pluggable components
    #
    config: UIResourceConfig

    @property
    def components(self) -> Iterator["UIResourceComponent"]:
        """Return initialized service components."""
        return (c(self) for c in self.config.components or [])

    def run_components(self, action, *args, **kwargs):
        """Run components for a given action."""

        for component in self.components:
            if hasattr(component, action):
                getattr(component, action)(*args, **kwargs)


class UIResource(UIComponentsMixin, Resource):
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

        for exception_class, handler in self.config.error_handlers.items():
            if isinstance(handler, str):
                handler = getattr(self, handler)
            blueprint.register_error_handler(exception_class, handler)

        return blueprint

    def fill_jinja_context(self):
        """function providing flask template app context processors"""
        ret = {}
        self.run_components("fill_jinja_context", context=ret)
        return ret


class FormConfigResource(UIComponentsMixin, Resource):
    config: FormConfigResourceConfig

    def create_url_rules(self):
        """Create the URL rules for the record resource."""
        routes = []
        route_config = self.config.routes
        for route_name, route_url in route_config.items():
            routes.append(route("GET", route_url, getattr(self, route_name)))
        return routes

    def _get_form_config(self, **kwargs):
        return self.config.form_config(**kwargs)

    @request_view_args
    def form_config(self):
        form_config = self._get_form_config()
        self.run_components(
            "form_config",
            form_config=form_config,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            identity=g.identity,
        )
        return form_config


class RecordsUIResource(UIResource):
    config: RecordsUIResourceConfig

    def __init__(self, config=None):
        """Constructor."""
        super(UIResource, self).__init__(config)

    def create_blueprint(self, **options):
        """Create the blueprint.

        Override this function to customize the creation of the ``Blueprint``
        object itself.
        """
        # do not set up the url prefix unline normal resource,
        # as RecordsUIResource is on two endpoints - /configs/abc and /abc
        return Blueprint(self.config.blueprint_name, __name__, **options)

    def create_url_rules(self):
        """Create the URL rules for the record resource."""
        routes = []
        route_config = self.config.routes
        for route_name, route_url in route_config.items():
            route_url = self.config.url_prefix.rstrip("/") + "/" + route_url.lstrip("/")
            if route_name == "search":
                search_route = route_url
                if not search_route.endswith("/"):
                    search_route += "/"
                search_route_without_slash = search_route[:-1]
                routes.append(route("GET", search_route, self.search))
                routes.append(
                    route(
                        "GET",
                        search_route_without_slash,
                        self.search_without_slash,
                    )
                )
            else:
                routes.append(route("GET", route_url, getattr(self, route_name)))

        for route_name, route_url in self.config.config_routes.items():
            if route_url:
                route_url = "{config_prefix}/{url_prefix}/{route}".format(
                    config_prefix=self.config.config_url_prefix.rstrip("/"),
                    url_prefix=self.config.url_prefix.strip("/"),
                    route=route_url.lstrip("/"),
                )
            else:
                route_url = "{config_prefix}/{url_prefix}".format(
                    config_prefix=self.config.config_url_prefix.rstrip("/"),
                    url_prefix=self.config.url_prefix.strip("/"),
                )

            routes.append(route("GET", route_url, getattr(self, route_name)))

        return routes

    def empty_record(self, resource_requestctx, **kwargs):
        """Create an empty record with default values."""
        empty_data = dump_empty(self.api_config.schema)
        files_field = getattr(self.api_config.record_cls, "files", None)
        if files_field and isinstance(files_field, FilesField):
            empty_data["files"] = {"enabled": True}
        empty_data = deepmerge.always_merger.merge(
            empty_data, copy.deepcopy(self.config.empty_record)
        )
        self.run_components(
            "empty_record",
            resource_requestctx=resource_requestctx,
            empty_data=empty_data,
        )

        return empty_data

    @property
    def ui_model(self):
        return current_oarepo_ui.ui_models.get(
            self.config.api_service.replace("-", "_"), {}
        )

    # helper function to avoid duplicating code between detail and preview handler
    @request_read_args
    @request_view_args
    @response_header_signposting
    def _detail(self, *, is_preview=False):
        if is_preview:
            api_record = self._get_record(
                resource_requestctx.view_args["pid_value"], allow_draft=is_preview
            )
            render_method = self.get_jinjax_macro(
                "preview",
                identity=g.identity,
                args=resource_requestctx.args,
                view_args=resource_requestctx.view_args,
                default_macro=self.config.templates["detail"],
            )

        else:
            api_record = self._get_record(
                resource_requestctx.view_args["pid_value"], allow_draft=is_preview
            )
            render_method = self.get_jinjax_macro(
                "detail",
                identity=g.identity,
                args=resource_requestctx.args,
                view_args=resource_requestctx.view_args,
            )

        # TODO: handle permissions UI way - better response than generic error
        record = self.config.ui_serializer.dump_obj(api_record.to_dict())
        record.setdefault("links", {})

        emitter = current_stats.get_event_emitter("record-view")
        if record is not None and emitter is not None:
            emitter(current_app, record=api_record._record, via_api=False)

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
        handlers = self._exportable_handlers()
        extra_context["exporters"] = {
            handler.export_code: handler for mimetype, handler in handlers
        }
        self.run_components(
            "before_ui_detail",
            api_record=api_record,
            record=record,
            identity=g.identity,
            extra_context=extra_context,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            ui_links=ui_links,
            is_preview=is_preview,
        )

        metadata = dict(record.get("metadata", record))
        render_kwargs = {
            **extra_context,
            "extra_context": extra_context,  # for backward compatibility
            "metadata": metadata,
            "ui": dict(record.get("ui", record)),
            "record": record,
            "api_record": api_record,
            "ui_links": ui_links,
            "context": current_oarepo_ui.catalog.jinja_env.globals,
            "d": FieldData(record, self.ui_model),
            "is_preview": is_preview,
        }

        response = Response(
            current_oarepo_ui.catalog.render(
                render_method,
                **render_kwargs,
            ),
            mimetype="text/html",
            status=200,
        )
        response._api_record = api_record
        return response

    def detail(self):
        """Returns item detail page."""
        return self._detail()

    @request_read_args
    @request_file_view_args
    def published_file_preview(self, *args, **kwargs):
        """Return file preview for published record."""
        record = self._get_record(
            resource_requestctx.view_args["pid_value"], allow_draft=False
        )._record

        return self._file_preview(record)

    @request_read_args
    @request_file_view_args
    def draft_file_preview(self, *args, **kwargs):
        """Return file preview for draft record."""
        record = self._get_record(
            resource_requestctx.view_args["pid_value"], allow_draft=True
        )._record
        return self._file_preview(record)

    def _file_preview(self, record):
        pid_value = resource_requestctx.view_args["pid_value"]
        filepath = resource_requestctx.view_args["filepath"]

        file_service = get_file_service_for_record_class(type(record))
        file_metadata = file_service.read_file_metadata(g.identity, pid_value, filepath)

        file_previewer = file_metadata.data.get("previewer")

        url = file_metadata.links["content"]

        # Find a suitable previewer
        fileobj = PreviewFile(file_metadata, pid_value, record, url)
        for plugin in current_previewer.iter_previewers(
            previewers=[file_previewer] if file_previewer else None
        ):
            if plugin.can_preview(fileobj):
                return plugin.preview(fileobj)

        return default_previewer.preview(fileobj)

    def preview(self):
        """Returns detail page preview."""
        return self._detail(is_preview=True)

    def make_links_absolute(self, links, api_prefix):
        # make links absolute
        for k, v in list(links.items()):
            if not isinstance(v, str):
                continue
            if not v.startswith("/") and not v.startswith("https://"):
                v = f"/api{api_prefix}{v}"
                links[k] = v

    def _get_record(
        self, pid_value_or_resource_requestctx, allow_draft=False, include_deleted=False
    ):
        if isinstance(pid_value_or_resource_requestctx, str):
            pid_value = pid_value_or_resource_requestctx
        else:
            log.warning(
                "_get_record should receive only pid_value, not the whole resouce_request_ctx"
            )
            pid_value = pid_value_or_resource_requestctx.view_args["pid_value"]

        try:
            if allow_draft:
                read_method = (
                    getattr(self.api_service, "read_draft") or self.api_service.read
                )
            else:
                read_method = self.api_service.read

            if include_deleted:
                # not all read methods support deleted records
                return read_method(
                    g.identity,
                    pid_value,
                    expand=True,
                    include_deleted=include_deleted,
                )
            else:
                return read_method(
                    g.identity,
                    pid_value,
                    expand=True,
                )
        except PermissionDenied as e:
            raise Forbidden() from e

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

        overridable_id_prefix = f"{self.config.application_id.capitalize()}.Search"

        default_components = {}

        for key, value in self.config.default_components.items():
            default_components[f"{overridable_id_prefix}.ResultsList.item.{key}"] = (
                value
            )

        search_options = dict(
            api_config=self.api_service.config,
            identity=g.identity,
            overrides={
                "ui_endpoint": self.config.url_prefix,
                "ui_links": ui_links,
                "overridableIdPrefix": overridable_id_prefix,
                "defaultComponents": default_components,
                "allowedHtmlTags": ["sup", "sub", "em", "strong"],
            },
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

        search_app_config = search_config(
            app_id=self.config.application_id.capitalize()
        )

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
            context=current_oarepo_ui.catalog.jinja_env.globals,
        )

    @request_read_args
    @request_view_args
    @request_export_args
    def _export(self, *, is_preview=False):
        export_format = resource_requestctx.view_args["export_format"]
        record = self._get_record(
            resource_requestctx.view_args["pid_value"], allow_draft=is_preview
        )
        handlers = self._exportable_handlers()
        handlers = [
            handler_tuple
            for handler_tuple in handlers
            if handler_tuple[1].export_code == export_format.lower()
        ]
        if not handlers:
            abort(404, f"No exporter for code {export_format}")
        mimetype = handlers[0][0]
        handler = handlers[0][1]
        exported_record = handler.serializer.serialize_object(record.to_dict())
        extension = guess_extension(mimetype)
        if not extension:
            first, second = mimetype.rsplit("/", maxsplit=1)
            _, second = second.rsplit("+", maxsplit=1)
            extension = guess_extension(f"{first}/{second}")
        filename = f"{record.id}{extension}"
        headers = {
            "Content-Type": mimetype,
            "Content-Disposition": f"attachment; filename={filename}",
        }
        return (exported_record, 200, headers)

    def _exportable_handlers(self):
        resource_config = self.resource_config
        if not resource_config:
            abort(
                404,
                "Cannot export due to missing configuration, specify RDM_MODELS option",
            )
        handlers = [
            (mimetype, handler)
            for mimetype, handler in resource_config.response_handlers.items()
            if isinstance(handler, ExportableResponseHandler)
        ]
        return handlers

    def export(self):
        return self._export()

    def export_preview(self):
        return self._export(is_preview=True)

    def get_jinjax_macro(
        self,
        template_type,
        identity=None,
        args=None,
        view_args=None,
        default_macro=None,
    ):
        """
        Returns which jinjax macro (name of the macro, including optional namespace in the form of "namespace.Macro")
        should be used for rendering the template.
        """
        if default_macro:
            return self.config.templates.get(template_type, default_macro)
        return self.config.templates[template_type]

    @request_read_args
    @request_view_args
    def edit(self):
        try:
            api_record = self._get_record(
                resource_requestctx.view_args["pid_value"], allow_draft=True
            )
        except:
            if not current_user.is_authenticated:
                return current_app.login_manager.unauthorized()
            raise
        try:
            if getattr(api_record._record, "is_draft", False):
                self.api_service.require_permission(
                    g.identity, "update_draft", record=api_record._record
                )  # ResultItem doesn't serialize state and owners field
            else:
                self.api_service.require_permission(
                    g.identity, "update", record=api_record._record
                )
        except PermissionDenied as e:
            raise Forbidden() from e

        data = api_record.to_dict()
        record = self.config.ui_serializer.dump_obj(data)
        form_config = self._get_form_config(
            g.identity, updateUrl=api_record.links.get("self", None)
        )

        form_config["ui_model"] = self.ui_model

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
            context=current_oarepo_ui.catalog.jinja_env.globals,
            d=FieldData(record, self.ui_model),
        )

    def _get_form_config(self, identity, **kwargs):
        return self.config.form_config(identity=identity, **kwargs)

    @login_required
    @request_read_args
    @request_view_args
    @request_create_args
    def create(self):
        if not self.has_deposit_permissions(g.identity):
            raise Forbidden()

        empty_record = self.empty_record(resource_requestctx)

        # TODO: use api service create link when available
        form_config = self._get_form_config(
            g.identity, createUrl=f"/api{self.api_service.config.url_prefix}"
        )

        form_config["ui_model"] = self.ui_model

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
        empty_record = self.default_communities(
            empty_record, form_config, resource_requestctx
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
            context=current_oarepo_ui.catalog.jinja_env.globals,
        )

    def has_deposit_permissions(self, identity):
        # check if permission policy contains a specialized "view_deposit_page" permission
        # and if so, use it, otherwise use the generic "can_create" permission
        permission_policy = self.api_service.permission_policy("view_deposit_page")
        if hasattr(permission_policy, "can_view_deposit_page"):
            return self.api_service.check_permission(
                identity, "view_deposit_page", record=None
            )
        else:
            return self.api_service.check_permission(identity, "create", record=None)

    def default_communities(self, empty_record, form_config, resource_requestctx):
        if "allowed_communities" not in form_config:
            return empty_record
        if "community" in resource_requestctx.args:
            community = resource_requestctx.args["community"]
            for c in form_config["allowed_communities"]:
                if c["slug"] == community:
                    empty_record["parent"]["communities"]["default"] = c["id"]
                    break
        elif len(form_config["allowed_communities"]) == 1:
            community = form_config["allowed_communities"][0]
            empty_record["parent"]["communities"]["default"] = community["id"]
        return empty_record

    @property
    def api_service(self):
        return current_service_registry.get(self.config.api_service)

    @property
    def resource_config(
        self,
    ):
        from flask import current_app

        if "RDM_MODELS" in current_app.config:
            for model_dict in current_app.config["RDM_MODELS"]:
                if model_dict["service_id"] == self.config.api_service:
                    config_cls = obj_or_import_string(model_dict["api_resource_config"])
                    if issubclass(config_cls, ConfiguratorMixin):
                        config = config_cls.build(current_app)
                    else:
                        config = config_cls()
                    return config

        return None

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

    def tombstone(self, error, *args, **kwargs):
        try:
            record = self._get_record(
                error.record.get("id", None), include_deleted=True
            )
            record_tombstone = record._record.get("tombstone", None)
        except (
            RecordDeletedException
        ) as e:  # read with include_deleted=True raises an exception instead of just returning record
            record_tombstone = e.record.get("tombstone")

        tombstone_dict = {}
        if record_tombstone:
            tombstone_dict = {
                "Removal reason": record_tombstone["removal_reason"]["id"],
                "Note": record_tombstone.get("note", ""),
                "Citation text": record_tombstone["citation_text"],
            }

        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "tombstone",
                identity=g.identity,
                default_macro="Tombstone",
            ),
            pid=getattr(error, "pid_value", None) or getattr(error, "pid", None),
            tombstone=tombstone_dict,
        )

    def not_found(self, error, *args, **kwargs):
        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "not_found",
                identity=g.identity,
                default_macro="NotFound",
            ),
            pid=getattr(error, "pid_value", None) or getattr(error, "pid", None),
        )

    def permission_denied(self, error, *args, **kwargs):
        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "permission_denied",
                identity=g.identity,
                default_macro="PermissionDenied",
            ),
            pid=getattr(error, "pid_value", None) or getattr(error, "pid", None),
            error=error,
        )

    @request_form_config_view_args
    def form_config(self):
        form_config = self._get_form_config(identity=g.identity)
        self.run_components(
            "form_config",
            form_config=form_config,
            api_record=None,
            record=None,
            data=None,
            ui_links=None,
            extra_context=None,
            args=resource_requestctx.args,
            view_args=resource_requestctx.view_args,
            identity=g.identity,
        )
        return form_config


# ported from https://github.com/inveniosoftware/invenio-app-rdm/blob/b1951f436027ad87214912e17c176727270e5e87/invenio_app_rdm/records_ui/views/records.py#L337
class PreviewFile:
    """Preview file implementation for InvenioRDM.

    This class was apparently created because of subtle differences with
    `invenio_previewer.api.PreviewFile`.
    """

    def __init__(self, file_item, record_pid_value, record=None, url=None):
        """Create a new PreviewFile."""
        self.file = file_item
        self.data = file_item.data
        self.record = record
        self.size = self.data["size"]
        self.filename = self.data["key"]
        self.bucket = self.data["bucket_id"]
        assert url is not None
        self.uri = url

    def is_local(self):
        """Check if file is local."""
        return True

    def has_extensions(self, *exts):
        """Check if file has one of the extensions.

        Each `exts` has the format `.{file type}` e.g. `.txt` .
        """
        file_ext = splitext(self.data["key"])[1].lower()
        return file_ext in exts

    def open(self):
        """Open the file."""
        return self.file._file.file.storage().open()


class TemplatePageUIResource(UIResource):
    def create_url_rules(self):
        """Create the URL rules for the record resource."""
        self.config: TemplatePageUIResourceConfig

        pages_config = self.config.pages
        routes = []
        for page_url_path, page_template_name in pages_config.items():
            handler = getattr(self, f"render_{page_template_name}", None) or partial(
                self.render, page=page_template_name
            )
            if not hasattr(handler, "__name__"):
                handler.__name__ = self.render.__name__
            if not hasattr(handler, "__self__"):
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


if False:
    from invenio_i18n import gettext as _

    just_for_translations = [_("Removal reason"), _("Note"), _("Citation text")]
