#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Implementation of record ui resources."""

from __future__ import annotations

import copy
import logging
from functools import partial
from http import HTTPStatus
from mimetypes import guess_extension
from typing import TYPE_CHECKING, Any, cast

import deepmerge
from flask import Blueprint, abort, current_app, g, redirect, request
from flask_login import current_user
from flask_principal import PermissionDenied
from flask_resources import (
    route,
)
from flask_security import login_required
from idutils.normalizers import to_url
from invenio_app_rdm.records_ui.views.records import PreviewFile
from invenio_i18n import gettext as _
from invenio_previewer import current_previewer
from invenio_previewer.extensions import default as default_previewer
from invenio_rdm_records.services.errors import RecordDeletedException
from invenio_records_resources.pagination import Pagination
from invenio_records_resources.records.systemfields import FilesField
from invenio_records_resources.services import LinksTemplate
from invenio_stats.proxies import current_stats
from werkzeug import Response
from werkzeug.exceptions import Forbidden

from oarepo_ui.utils import dump_empty

# Resource
#
from ...proxies import current_oarepo_ui
from ...templating.data import FieldData
from ..base import UIResource, pass_query_args, pass_route_args
from ..signposting import response_header_signposting
from ..utils import set_api_record_to_response
from .config import (
    RecordsUIResourceConfig,
)

if TYPE_CHECKING:
    from collections.abc import Mapping

    from invenio_access.permissions import Identity
    from invenio_drafts_resources.services.records.service import (
        RecordService as DraftService,
    )
    from invenio_records_resources.records.api import Record
    from invenio_records_resources.services.records.config import RecordServiceConfig
    from invenio_records_resources.services.records.results import RecordItem


log = logging.getLogger(__name__)


class RecordsUIResource(UIResource[RecordsUIResourceConfig]):
    """A resource for accessing UI (such as detail, search, edit) for records."""

    def create_blueprint(self, **options: Any) -> Blueprint:
        """Create the blueprint.

        Override this function to customize the creation of the ``Blueprint``
        object itself.
        """
        # do not set up the url prefix unline normal resource,
        # as RecordsUIResource is on two endpoints - /configs/abc and /abc
        return Blueprint(self.config.blueprint_name, __name__, **options)

    def create_url_rules(self) -> list[dict[str, Any]]:
        """Create the URL rules for the record resource."""
        routes = []
        route_config = self.config.routes
        for route_name, route_url in route_config.items():
            url_prefix: str = self.config.url_prefix
            route_url_with_prefix = url_prefix.rstrip("/") + "/" + route_url.lstrip("/")
            if route_name == "search":
                search_route = route_url_with_prefix
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
                routes.append(route("GET", route_url_with_prefix, getattr(self, route_name)))

        for route_name, config_route_url in self.config.config_routes.items():
            if config_route_url:
                config_route_url_with_prefix = "{config_prefix}/{url_prefix}/{route}".format(
                    config_prefix=self.config.config_url_prefix.rstrip("/"),
                    url_prefix=self.config.url_prefix.strip("/"),
                    route=config_route_url.lstrip("/"),
                )
            else:
                config_route_url_with_prefix = "{config_prefix}/{url_prefix}".format(
                    config_prefix=self.config.config_url_prefix.rstrip("/"),
                    url_prefix=self.config.url_prefix.strip("/"),
                )

            routes.append(route("GET", config_route_url_with_prefix, getattr(self, route_name)))

        return routes

    def empty_record(self, **kwargs: Any) -> dict[str, Any]:
        """Create an empty record with default values."""
        empty_data = cast("dict[str, Any]", dump_empty(self.api_config.schema))
        files_field = getattr(self.api_config.record_cls, "files", None)
        if files_field and isinstance(files_field, FilesField):
            empty_data["files"] = {"enabled": True}
        empty_data = cast(
            "dict[str, Any]",
            deepmerge.always_merger.merge(empty_data, copy.deepcopy(self.config.empty_record)),
        )
        self.run_components("empty_record", empty_data=empty_data, **kwargs)

        return empty_data

    @property
    def ui_model(self) -> Mapping[str, Any]:
        """Get the UI model for the resource."""
        # mypy seems to ignore the type in runtime, thus added ignore
        return self.config.model.ui_model  # type: ignore[no-any-return]

    def _record_from_service_result(self, result: RecordItem) -> Record:
        return cast("Record", result._record)  # noqa: SLF001  private attribute

    # helper function to avoid duplicating code between detail and preview handler
    def _detail(
        self,
        pid_value: str,
        embed: bool = False,
        is_preview: bool = False,
        **kwargs: Any,
    ) -> Response:
        """Render detail or preview page for a record, called from detail and preview methods.

        :param pid_value: Persistent identifier value for the record.
        :param embed: Whether to embed the page.
        :param is_preview: Whether to render as preview.
        :param kwargs: Additional context for rendering.
        :return: Flask Response object with rendered page.
        :raises: May raise Forbidden if permissions are denied.
        """
        if is_preview:
            api_record = self._get_record(pid_value, allow_draft=is_preview)
            render_method = self.get_jinjax_macro(
                "preview",
                default_macro=self.config.templates["detail"],
            )

        else:
            api_record = self._get_record(pid_value, allow_draft=is_preview)
            render_method = self.get_jinjax_macro(
                "detail",
            )
        # TODO: handle permissions UI way - better response than generic error
        if not self.config.ui_serializer:
            ui_data_serialization = api_record.to_dict()
        else:
            ui_data_serialization = self.config.ui_serializer.dump_obj(api_record.to_dict())
        ui_data_serialization.setdefault("links", {})

        emitter = current_stats.get_event_emitter("record-view")  # type: ignore[attr-defined]
        if ui_data_serialization is not None and emitter is not None:
            emitter(
                current_app,
                record=self._record_from_service_result(api_record),
                via_api=False,
            )

        ui_links = self.expand_detail_links(identity=g.identity, record=api_record)
        export_path = request.path.split("?")[0]
        if not export_path.endswith("/"):
            export_path += "/"
        export_path += "export"

        ui_data_serialization["links"].update(
            {
                "ui_links": ui_links,
                "export_path": export_path,
                "search_link": self.config.url_prefix,
            }
        )

        self.make_links_absolute(ui_data_serialization["links"], self.api_service.config.url_prefix)
        extra_context = {}
        extra_context["exporters"] = {export.code: export for export in self.config.model.exports}
        self.run_components(
            "before_ui_detail",
            api_record=api_record,
            record=ui_data_serialization,
            identity=g.identity,
            extra_context=extra_context,
            ui_links=ui_links,
            is_preview=is_preview,
            embedded=embed,
            **kwargs,
        )
        metadata = dict(ui_data_serialization.get("metadata", ui_data_serialization))

        render_kwargs = {
            **extra_context,
            "extra_context": extra_context,  # for backward compatibility
            "metadata": metadata,
            "ui": dict(ui_data_serialization.get("ui", ui_data_serialization)),
            "record": ui_data_serialization,
            "api_record": api_record,
            "ui_links": ui_links,
            "context": current_oarepo_ui.catalog.jinja_env.globals,
            "d": FieldData.create(
                api_data=api_record.to_dict(),
                ui_data=ui_data_serialization,
                ui_definitions=self.ui_model,
                item_getter=self.config.field_data_item_getter,
            ),
            "is_preview": is_preview,
            "embedded": embed,
        }

        response = Response(
            current_oarepo_ui.catalog.render(
                render_method,
                **render_kwargs,
            ),
            mimetype="text/html",
            status=200,
        )
        set_api_record_to_response(response, api_record)
        return response

    @pass_route_args("view")
    @pass_query_args("read", "embed", exclude=["is_preview"])
    @response_header_signposting
    def detail(
        self,
        pid_value: str,
        embed: bool = False,
        is_preview: bool = False,
        **kwargs: Any,
    ) -> Response:
        """Return item detail page."""
        return self._detail(pid_value=pid_value, embed=embed, is_preview=is_preview, **kwargs)

    @pass_route_args("view")
    @pass_query_args("read", "embed", exclude=["is_preview"])
    @response_header_signposting
    def latest(
        self,
        pid_value: str,
        embed: bool = False,
        is_preview: bool = False,
        **kwargs: Any,
    ) -> Response:
        """Return latest item detail page."""
        # TODO: just a hotfix implementation for now, not a proper latest version detail view
        return self._detail(pid_value=pid_value, embed=embed, is_preview=is_preview, **kwargs)

    @pass_route_args("view", "file_view")
    def published_file_preview(
        self,
        pid_value: str,
        filepath: str,
        **kwargs: Any,  # noqa: ARG002 for inheritance
    ) -> Response:
        """Return file preview for published record."""
        record = self._get_record(pid_value, allow_draft=False)
        return self._file_preview(record, pid_value, filepath)

    @pass_route_args("view", "file_view")
    def draft_file_preview(
        self,
        pid_value: str,
        filepath: str,
        **kwargs: Any,  # noqa: ARG002 for inheritance
    ) -> Response:
        """Return file preview for draft record."""
        record = self._get_record(pid_value, allow_draft=True)
        return self._file_preview(record, pid_value, filepath)

    def _file_preview(self, record: RecordItem, pid_value: str, filepath: str) -> Response:
        file_service = self.config.model.file_service
        if file_service is None:
            return Response(
                _("File preview requested but file service is not available on the model"),
                status=HTTPStatus.NOT_FOUND,
            )
        file_metadata = file_service.read_file_metadata(g.identity, pid_value, filepath)

        file_previewer = file_metadata.data.get("previewer")

        url = file_metadata.links["content"]

        # Find a suitable previewer
        fileobj = PreviewFile(file_metadata, pid_value, record, url)
        for plugin in current_previewer.iter_previewers(  # type: ignore[attr-defined]
            previewers=[file_previewer] if file_previewer else None
        ):
            if plugin.can_preview(fileobj):
                return cast("Response", plugin.preview(fileobj))

        return cast("Response", default_previewer.preview(fileobj))

    @pass_route_args("view")
    @pass_query_args("read", "embed", exclude=["is_preview"])
    @response_header_signposting
    def preview(self, pid_value: str, embed: bool = False, **kwargs: Any) -> Response:
        """Return detail page preview."""
        return self._detail(pid_value=pid_value, embed=embed, is_preview=True, **kwargs)

    # TODO: check this, might be removed by using EndpointLink etc.
    def make_links_absolute(self, links: dict, api_prefix: str) -> None:
        """Make all links in the dictionary absolute by prepending API prefix.

        :param links: Dictionary of links to update.
        :param api_prefix: API prefix to prepend to relative links.
        """
        # make links absolute
        for k, v in list(links.items()):
            if not isinstance(v, str):
                continue
            if not v.startswith("/") and not v.startswith("https://"):
                links[k] = f"/api{api_prefix}{v}"

    def _get_record(self, pid_value: str, allow_draft: bool = False, include_deleted: bool = False) -> RecordItem:
        """Retrieve a record by persistent identifier, optionally allowing draft or deleted records.

        :param pid_value: Persistent identifier value for the record.
        :param allow_draft: Whether to allow draft records.
        :param include_deleted: Whether to include deleted records.
        :return: Record object.
        :raises Forbidden: If permissions are denied.
        """
        try:
            read_method = self.api_service.read_draft if allow_draft else self.api_service.read

            if include_deleted:
                # not all read methods support deleted records
                return cast(
                    "RecordItem",
                    read_method(
                        g.identity,
                        pid_value,
                        expand=True,
                        include_deleted=include_deleted,  # type: ignore[call-arg]
                    ),
                )
            return cast(
                "RecordItem",
                read_method(
                    g.identity,
                    pid_value,
                    expand=True,
                ),
            )
        except PermissionDenied as e:
            raise Forbidden(str(e)) from e

    def search_without_slash(self) -> Response:
        """Redirect search request without trailing slash to the one with slash."""
        split_path = request.full_path.split("?", maxsplit=1)
        path_with_slash = split_path[0] + "/"
        if len(split_path) == 1:
            return redirect(path_with_slash, code=302)
        return redirect(path_with_slash + "?" + split_path[1], code=302)

    @pass_query_args("search")
    def search(self, page: int = 1, size: int = 10, **kwargs: Any) -> str | Response:
        """Return search page."""
        pagination = Pagination(
            size,
            page,
            # we should present all links
            # (but do not want to get the count as it is another request to Opensearch)
            (page + 1) * size,
        )
        ui_links = self.expand_search_links(g.identity, pagination, kwargs)

        overridable_id_prefix = f"{self.config.application_id.capitalize()}.Search"

        default_components = {}

        for key, value in self.config.default_components.items():
            default_components[f"{overridable_id_prefix}.ResultsList.item.{key}"] = value
        search_options = {
            "api_config": self.api_service.config,
            "identity": g.identity,
            "overrides": {
                "ui_endpoint": self.config.url_prefix,
                "ui_links": ui_links,
                "overridableIdPrefix": overridable_id_prefix,
                "defaultComponents": default_components,
                "allowedHtmlTags": ["sup", "sub", "em", "strong"],
                "ignoredSearchFilters": self.config.ignored_search_filters(),
                "additionalFilterLabels": self.config.additional_filter_labels(filters=kwargs.get("facets", {})),
            },
        }

        extra_context: dict[str, Any] = {}

        self.run_components(
            "before_ui_search",
            identity=g.identity,
            search_options=search_options,
            ui_config=self.config,
            ui_links=ui_links,
            extra_context=extra_context,
            **kwargs,
        )

        search_config = partial(self.config.search_app_config, **search_options)

        search_app_config = search_config(app_id=self.config.application_id.capitalize())

        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "search",
            ),
            search_app_config=search_app_config,
            ui_config=self.config,
            ui_resource=self,
            ui_links=ui_links,
            extra_context=extra_context,
            context=current_oarepo_ui.catalog.jinja_env.globals,
        )

    def _export(self, pid_value: str, export_format: str, is_preview: bool = False) -> tuple[Any, int, dict[str, str]]:
        """Export a record in the specified format.

        :param pid_value: Persistent identifier value for the record.
        :param export_format: Format code for export.
        :param is_preview: Whether to export a preview version.
        :return: Tuple of (exported data, status code, headers).
        :raises: 404 if no exporter is found.
        """
        record = self._get_record(pid_value, allow_draft=is_preview)
        exports = [export for export in self.config.model.exports if export.code.lower() == export_format.lower()]
        if not exports:
            abort(404, f"No exporter for code {export_format}")
        mimetype = exports[0].mimetype
        serializer = exports[0].serializer
        exported_record = serializer.serialize_object(record.to_dict())
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

    @pass_route_args("view", "export")
    def export(
        self,
        pid_value: str,
        export_format: str,
        **kwargs: Any,  # noqa: ARG002 for inheritance
    ) -> tuple[Any, int, dict[str, str]]:
        """Export a record in the specified format."""
        return self._export(pid_value, export_format)

    @pass_route_args("view", "export")
    def export_preview(
        self,
        pid_value: str,
        export_format: str,
        **kwargs: Any,  # noqa: ARG002 for inheritance
    ) -> tuple[Any, int, dict[str, str]]:
        """Export a preview of a record in the specified format."""
        return self._export(pid_value, export_format, is_preview=True)

    def get_jinjax_macro(self, template_type: str, default_macro: str | None = None) -> str:
        """Return which jinjax macro should be used for rendering the template.

        Name of the macro may include optional namespace in the form of "namespace.Macro".

        :param template_type: Type of template to render (e.g., 'detail', 'search').
        :param default_macro: Default macro name if not found in config.
        :return: Macro name string.
        """
        tmpl = self.config.templates.get(template_type, default_macro)
        if not tmpl:
            raise KeyError(f"Template {template_type} not found and default macro was not provided.")
        return tmpl

    @pass_route_args("view")
    def edit(self, pid_value: str, **kwargs: Any) -> str | Response:
        """Return edit page for a record."""
        try:
            api_record = self._get_record(pid_value, allow_draft=True)
        except:
            if not current_user.is_authenticated:  # type: ignore[attr-defined]
                # if user is not authenticated, force a login
                login_manager = current_app.login_manager  # type: ignore[attr-defined]
                return login_manager.unauthorized()  # type: ignore[no-any-return]
            raise
        try:
            underlying_record = self._record_from_service_result(api_record)
            if getattr(underlying_record, "is_draft", False):
                self.api_service.require_permission(
                    g.identity, "update_draft", record=underlying_record
                )  # ResultItem doesn't serialize state and owners field
            else:
                self.api_service.require_permission(g.identity, "update", record=underlying_record)
        except PermissionDenied as e:
            raise Forbidden(str(e)) from e

        api_record_serialization = api_record.to_dict()
        ui_serialization = self.config.ui_serializer.dump_obj(api_record_serialization)
        form_config = self._get_form_config(g.identity, updateUrl=api_record.links.get("self", None))

        form_config["ui_model"] = self.ui_model

        ui_links = self.expand_detail_links(identity=g.identity, record=api_record)

        extra_context: dict[str, Any] = {}

        self.run_components(
            "form_config",
            api_record=api_record,
            data=api_record_serialization,
            record=ui_serialization,
            identity=g.identity,
            form_config=form_config,
            ui_links=ui_links,
            extra_context=extra_context,
            **kwargs,
        )
        self.run_components(
            "before_ui_edit",
            api_record=api_record,
            record=ui_serialization,
            data=api_record_serialization,
            form_config=form_config,
            ui_links=ui_links,
            identity=g.identity,
            extra_context=extra_context,
            **kwargs,
        )

        ui_serialization["extra_links"] = {
            "ui_links": ui_links,
            "search_link": self.config.url_prefix,
        }

        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "edit",
            ),
            record=ui_serialization,
            api_record=api_record,
            form_config=form_config,
            extra_context=extra_context,
            ui_links=ui_links,
            data=api_record_serialization,
            context=current_oarepo_ui.catalog.jinja_env.globals,
            d=FieldData.create(
                api_data=api_record_serialization,
                ui_data=ui_serialization,
                ui_definitions=self.ui_model,
                item_getter=self.config.field_data_item_getter,
            ),
        )

    def _get_form_config(self, identity: Identity, **kwargs: Any) -> dict[str, Any]:
        return self.config.form_config(identity=identity, **kwargs)

    @login_required
    @pass_query_args("create")
    def create(self, **kwargs: Any) -> str | Response:
        """Return create page for a record."""
        if not self.has_deposit_permissions(g.identity):
            raise Forbidden("User does not have permission to create a record.")

        # TODO: use api service create link when available
        form_config = self._get_form_config(g.identity, createUrl=self.config.model.api_url("create"))

        form_config["ui_model"] = self.ui_model

        extra_context: dict[str, Any] = {}

        ui_links: dict[str, str] = {}

        self.run_components(
            "form_config",
            api_record=None,
            record=None,
            form_config=form_config,
            identity=g.identity,
            extra_context=extra_context,
            ui_links=ui_links,
            **kwargs,
        )
        empty_record = self.empty_record(form_config=form_config, **kwargs)

        self.run_components(
            "before_ui_create",
            data=empty_record,
            record=None,
            api_record=None,
            form_config=form_config,
            identity=g.identity,
            extra_context=extra_context,
            ui_links=ui_links,
            **kwargs,
        )
        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "create",
            ),
            record=empty_record,
            api_record=None,
            form_config=form_config,
            extra_context=extra_context,
            ui_links=ui_links,
            data=empty_record,
            context=current_oarepo_ui.catalog.jinja_env.globals,
            **kwargs,
        )

    def has_deposit_permissions(self, identity: Identity) -> bool:
        """Check if the identity has deposit permissions for creating records.

        :param identity: User identity object.
        :return: True if deposit is allowed, False otherwise.
        """
        # check if permission policy contains a specialized "view_deposit_page" permission
        # and if so, use it, otherwise use the generic "can_create" permission
        permission_policy = self.api_service.permission_policy("view_deposit_page")
        if hasattr(permission_policy, "can_view_deposit_page"):
            return cast(
                "bool",
                self.api_service.check_permission(identity, "view_deposit_page", record=None),
            )
        return cast("bool", self.api_service.check_permission(identity, "create", record=None))

    @property
    def api_service(self) -> DraftService:
        """Get the API service for this resource."""
        # TODO: this is not correct, we should maybe differentiate normal UIRecord and DraftUIRecord
        return cast("DraftService", self.config.model.service)

    @property
    def api_config(self) -> RecordServiceConfig:
        """Get the API service configuration for this resource."""
        return self.config.model.service_config

    def expand_detail_links(self, identity: Identity, record: RecordItem) -> dict[str, str]:
        """Get links for a detail result item using the configured template.

        :param identity: User identity object.
        :param record: Record object.
        :return: Dictionary of expanded links.
        """
        tpl = LinksTemplate(self.config.ui_links_item, {"url_prefix": self.config.url_prefix})
        return cast(
            "dict[str, str]",
            tpl.expand(identity, self._record_from_service_result(record)),
        )

    def expand_search_links(
        self, identity: Identity, pagination: Pagination, query_args: dict[str, str]
    ) -> dict[str, str]:
        """Get links for a search result item using the configured template.

        :param identity: User identity object.
        :param pagination: Pagination object.
        :param query_args: Query arguments dictionary.
        :return: Dictionary of expanded links.
        """
        """Get links for this result item."""
        tpl = LinksTemplate(
            self.config.ui_links_search,
            {
                "config": self.config,
                "url_prefix": self.config.url_prefix,
                # need to pass current page and size as they are not added in self link
                "args": {
                    **query_args,
                    "page": pagination.page,
                    "size": pagination.size,
                },
            },
        )
        return cast("dict[str, str]", tpl.expand(identity, pagination))

    def tombstone(
        self,
        error: Exception,
        *args: Any,  # noqa: ARG002 for inheritance
        **kwargs: Any,  # noqa: ARG002 for inheritance
    ) -> str | Response:
        """Error handler to render a tombstone page for deleted or tombstoned records.

        :param error: Exception containing record info.
        :param args: Additional arguments.
        :param kwargs: Additional keyword arguments.
        :return: Rendered tombstone page.
        """
        try:
            record_attr = getattr(error, "record", None)

            if not record_attr:
                # there is no "record" attribute on the error
                return _("No record found for the tombstone page")
            if not isinstance(record_attr, dict):
                # record is not a dict, so we cannot get id from it
                return _("No record found for the tombstone page, incorrect parameter")

            pid_value = record_attr.get("id", None)
            if pid_value is None:
                # record does not have id, so we cannot get it
                return _("No record found for the tombstone page, no id")
            record = self._get_record(pid_value, include_deleted=True)
            record_dict = self._record_from_service_result(record)
            record_dict.setdefault("links", record.links)
        except RecordDeletedException as e:
            # read with include_deleted=True raises an exception instead of just returning record
            record_dict = e.record

        # TODO: convert this into a marshmallow schema
        record_tombstone = record_dict.get("tombstone", None)
        record_doi = record_dict.get("pids", {}).get("doi", {}).get("identifier", None)
        if record_doi:
            record_doi = to_url(record_doi, "doi", url_scheme="https")

        tombstone_url = record_doi or record_dict.get("links", {}).get("self_html", None)

        tombstone_dict = {}
        if record_tombstone:
            tombstone_dict = {
                "Removal reason": record_tombstone["removal_reason"]["id"],
                "Note": record_tombstone.get("note", ""),
                "Citation text": record_tombstone["citation_text"],
                "URL": tombstone_url,
            }

        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "tombstone",
                default_macro="Tombstone",
            ),
            pid=getattr(error, "pid_value", None) or getattr(error, "pid", None),
            tombstone=tombstone_dict,
        )

    def not_found(
        self,
        error: Exception,
        *args: Any,  # noqa: ARG002 for inheritance
        **kwargs: Any,  # noqa: ARG002 for inheritance
    ) -> str | Response:
        """Error handler to render a not found page for missing records.

        :param error: Exception containing record info.
        :param args: Additional arguments.
        :param kwargs: Additional keyword arguments.
        :return: Rendered not found page.
        """
        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "not_found",
                default_macro="NotFound",
            ),
            pid=getattr(error, "pid_value", None) or getattr(error, "pid", None),
        )

    def permission_denied(
        self,
        error: Exception,
        *args: Any,  # noqa: ARG002 for inheritance
        **kwargs: Any,  # noqa: ARG002 for inheritance
    ) -> str | Response:
        """Error handler to render a permission denied page for unauthorized access.

        :param error: Exception containing record info.
        :param args: Additional arguments.
        :param kwargs: Additional keyword arguments.
        :return: Rendered permission denied page.
        """
        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "permission_denied",
                default_macro="PermissionDenied",
            ),
            pid=getattr(error, "pid_value", None) or getattr(error, "pid", None),
            error=error,
        )

    @pass_route_args("form_config_view")
    def form_config(self, **kwargs: Any) -> dict[str, Any]:
        """Return form configuration for React forms."""
        form_config = self._get_form_config(identity=g.identity)
        self.run_components(
            "form_config",
            form_config=form_config,
            api_record=None,
            record=None,
            data=None,
            ui_links=None,
            extra_context=None,
            identity=g.identity,
            **kwargs,
        )
        return form_config


if False:
    just_for_translations = [  # type: ignore[unreachable]
        _("Removal reason"),
        _("Note"),
        _("Citation text"),
    ]
