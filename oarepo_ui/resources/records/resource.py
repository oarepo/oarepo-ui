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

from flask import (
    Blueprint,
    abort,
    current_app,
    g,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user
from flask_principal import PermissionDenied
from flask_resources import (
    route,
)
from flask_security import login_required
from idutils.normalizers import to_url
from invenio_app_rdm.records_ui.utils import set_default_value
from invenio_app_rdm.records_ui.views.decorators import no_cache_response
from invenio_app_rdm.records_ui.views.deposits import get_actual_files_quota
from invenio_app_rdm.records_ui.views.records import (
    PreviewFile,
    not_found_error,
)
from invenio_i18n import gettext as _
from invenio_previewer import current_previewer
from invenio_previewer.extensions import default as default_previewer
from invenio_rdm_records.proxies import current_rdm_records
from invenio_rdm_records.records.systemfields.access.access_settings import (
    AccessSettings,
)
from invenio_rdm_records.services.errors import RecordDeletedException
from invenio_records_resources.pagination import Pagination
from invenio_records_resources.services import LinksTemplate
from invenio_records_resources.services.errors import (
    PermissionDeniedError,
)
from invenio_stats.proxies import current_stats
from invenio_users_resources.proxies import current_user_resources
from marshmallow import ValidationError
from oarepo_runtime.typing import record_from_result
from werkzeug import Response
from werkzeug.exceptions import Forbidden

from oarepo_ui.resources.decorators import (
    pass_draft,
    pass_draft_files,
    pass_record_files,
    pass_record_latest,
    pass_record_media_files,
    pass_record_or_draft,
    secret_link_or_login_required,
)
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

    from flask.typing import ResponseReturnValue
    from invenio_access.permissions import Identity
    from invenio_drafts_resources.services.records.service import (
        RecordService as DraftService,
    )
    from invenio_records_resources.records.api import Record
    from invenio_records_resources.services.files.results import FileList
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
                # can't see how to correctly cast route which needs a FlaskResponse
                # returning function and search that returns werkzeug's Response
                routes.append(route("GET", search_route, cast("Any", self.search)))
                routes.append(
                    route(
                        "GET",
                        search_route_without_slash,
                        cast("Any", self.search_without_slash),
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
        record = cast("dict[str, Any]", dump_empty(self.api_config.schema))
        record["files"] = {"enabled": current_app.config.get("RDM_DEFAULT_FILES_ENABLED")}
        record.setdefault("expanded", {})
        # Set by RDMRecordServiceConfig class
        pids_providers = getattr(self.api_config, "pids_providers", None)

        if pids_providers and "doi" in pids_providers:
            if (
                current_app.config["RDM_PERSISTENT_IDENTIFIERS"].get("doi", {}).get("ui", {}).get("default_selected")
                == "yes"  # yes, no or not_needed
            ):
                record["pids"] = {"doi": {"provider": "external", "identifier": ""}}
            else:
                record["pids"] = {}
        else:
            record["pids"] = {}
        record["status"] = "draft"
        defaults = current_app.config.get("APP_RDM_DEPOSIT_FORM_DEFAULTS") or {}
        for key, value in defaults.items():
            set_default_value(record, value, key)

        self.run_components("empty_record", empty_data=record, **kwargs)
        return record

    @property
    def ui_model(self) -> Mapping[str, Any]:
        """Get the UI model for the resource."""
        # mypy seems to ignore the type in runtime, thus added ignore
        if not self.config.model:
            return {}
        return self.config.model.ui_model  # type: ignore[no-any-return]

    def _record_from_service_result(self, result: RecordItem) -> Record:
        return cast("Record", record_from_result(result))

    def _prepare_files(self, files: FileList, media_files: FileList) -> tuple[dict | None, dict | None]:
        """Convert FileList objects to dictionaries for rendering."""
        files_dict = None if files is None else files.to_dict()
        media_files_dict = None if media_files is None else media_files.to_dict()
        return files_dict, media_files_dict

    def _prepare_record_ui(self, record: RecordItem) -> dict[str, Any]:
        """Prepare record data for UI rendering."""
        parent = getattr(record_from_result(record), "parent", None)
        if parent is not None:
            access = parent.get("access")
            if not access or access.get("settings") is None:
                parent["access"]["settings"] = AccessSettings({}).dump()

        if not self.config.ui_serializer:
            record_ui = record.to_dict()
        else:
            record_ui = self.config.ui_serializer.dump_obj(record.to_dict())

        record_ui.setdefault("links", {})
        return cast("dict[str, Any]", record_ui)

    def _get_user_avatar(self) -> str | None:
        """Retrieve the current user's avatar if authenticated."""
        if current_user.is_authenticated:
            return cast(
                "str|None",
                current_user_resources.users_service.links_item_tpl.expand(g.identity, current_user).get("avatar"),
            )
        return None

    def _validate_draft_preview(self, record: RecordItem) -> None:
        """Validate draft structure and inject parent DOI if needed for preview."""
        try:
            current_rdm_records.records_service.validate_draft(g.identity, record.id, ignore_field_permissions=True)
        except ValidationError:
            abort(404)

    def _inject_parent_doi_if_needed(self, record: RecordItem, record_ui: dict) -> None:
        """Inject a parent DOI into the draft UI if Datacite is enabled and required."""
        if not current_app.config.get("DATACITE_ENABLED"):
            return

        service = current_rdm_records.records_service
        datacite_providers = [
            v["datacite"] for p, v in service.config.parent_pids_providers.items() if p == "doi" and "datacite" in v
        ]
        if not datacite_providers:
            return

        datacite_provider = datacite_providers[0]
        should_mint_parent_doi = True

        is_doi_required = current_app.config.get("RDM_PARENT_PERSISTENT_IDENTIFIERS", {}).get("doi", {}).get("required")
        if not is_doi_required:
            pids = getattr(record_from_result(record), "pids", {})
            record_doi = pids.get("doi", {})
            is_doi_reserved = record_doi.get("provider", "") == "datacite" and record_doi.get("identifier")
            if not is_doi_reserved:
                should_mint_parent_doi = False

        if should_mint_parent_doi:
            parent = getattr(record_from_result(record), "parent", None)
            if parent:
                parent_doi = datacite_provider.client.generate_doi(parent)
                record_ui.setdefault("ui", {})["new_draft_parent_doi"] = parent_doi
            else:
                raise ValueError(f"Record {record['id']} has no parent field.")

    @pass_route_args("view")
    @pass_query_args("record_detail")
    @pass_record_or_draft(expand=True)
    @pass_record_files
    @pass_record_media_files
    @response_header_signposting
    def record_detail(
        self,
        record: RecordItem,
        files: FileList,
        media_files: FileList,
        is_preview: bool = False,
        include_deleted: bool = False,
        **kwargs: Any,  # noqa ARG002
    ) -> ResponseReturnValue:
        """Record detail page (aka landing page) adapted from invenio-app-rdm view."""
        files_dict, media_files_dict = self._prepare_files(files, media_files)
        record_ui = self._prepare_record_ui(record)
        is_draft = record_ui["is_draft"]
        avatar = self._get_user_avatar()

        # TODO: implement custom fields feature

        if is_preview and is_draft:
            # it is possible to save incomplete drafts that break the normal
            # (preview) landing page rendering
            # to prevent this from happening, we validate the draft's structure
            # see: https://github.com/inveniosoftware/invenio-app-rdm/issues/1051
            self._validate_draft_preview(record)
            self._inject_parent_doi_if_needed(record, record_ui)

        # emit a record view stats event
        emitter = current_stats.get_event_emitter("record-view")
        if record is not None and emitter is not None:
            emitter(current_app, record=record_from_result(record), via_api=False)

        record_owner = record_ui.get("expanded", {}).get("parent", {}).get("access", {}).get("owned_by", {})
        # TODO: implement communities & community theme
        resolved_community, resolved_community_ui = None, None

        render_kwargs = {
            "record": record,
            "record_ui": record_ui,
            "files": files_dict,
            "media_files": media_files_dict,
            # TODO: implement user_communities_memberships
            "permissions": record.has_permissions_to(
                [
                    "edit",
                    "new_version",
                    "manage",
                    "update_draft",
                    "read_files",
                    "review",
                    "view",
                    "media_read_files",
                    "moderate",
                ]
            ),
            # TODO: implement custom fields
            "is_preview": is_preview,
            "include_deleted": include_deleted,
            "is_draft": is_draft,
            "community": resolved_community,
            "community_ui": resolved_community_ui,
            # TODO: implement external resources
            "user_avatar": avatar,
            # record created with system_identity have not owners e.g demo
            "record_owner_id": record_owner.get("id"),
            # JinjaX support
            "context": current_oarepo_ui.catalog.jinja_env.globals,
            "d": FieldData.create(
                api_data=record.to_dict(),
                ui_data=record_ui,
                ui_definitions=self.ui_model,
                item_getter=self.config.field_data_item_getter,
            ),
        }

        # TODO: implement render_community_theme_template?
        response = Response(
            current_oarepo_ui.catalog.render(
                self.get_jinjax_macro("record_detail"),
                **render_kwargs,
            ),
            mimetype="text/html",
            status=200,
        )
        set_api_record_to_response(response, record)
        return response

    @pass_route_args("view")
    @pass_record_latest
    def record_latest(self, record: RecordItem, **kwargs: Any):  # noqa ARG002
        """Redirect to record's latest version page."""
        return redirect(cast("str", record.links.get("self_html")), code=302)

    @pass_route_args("view", "file_view")
    def published_file_preview(self, pid_value: str, filepath: str, **kwargs: Any) -> Response:
        """Return file preview for published record."""
        record = self._get_record(pid_value, allow_draft=False, **kwargs)
        return self._file_preview(record, pid_value, filepath)

    @pass_route_args("view", "file_view")
    def draft_file_preview(self, pid_value: str, filepath: str, **kwargs: Any) -> Response:
        """Return file preview for draft record."""
        record = self._get_record(pid_value, allow_draft=True, **kwargs)
        return self._file_preview(record, pid_value, filepath)

    def _file_preview(self, record: RecordItem, pid_value: str, filepath: str) -> Response:
        if not self.config.model:
            raise RuntimeError(f"Model {self.config.model_name} not registered. File cannot be previewed.")

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

    def _get_record(
        self,
        pid_value: str,
        allow_draft: bool = False,
        include_deleted: bool = False,
        **kwargs: Any,  # noqa: ARG002
    ) -> RecordItem:
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
    def search(self, page: int = 1, size: int = 10, **kwargs: Any) -> ResponseReturnValue:
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

        search_options = {
            "api_config": self.api_service.config,
            "identity": g.identity,
            "overrides": {
                "ui_endpoint": self.config.url_prefix,
                "ui_links": ui_links,
                "overridableIdPrefix": overridable_id_prefix,
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

    def _export(
        self,
        pid_value: str,
        export_format: str,
        is_preview: bool = False,
        **kwargs: Any,
    ) -> tuple[Any, int, dict[str, str]] | None:
        """Export a record in the specified format.

        :param pid_value: Persistent identifier value for the record.
        :param export_format: Format code for export.
        :param is_preview: Whether to export a preview version.
        :return: Tuple of (exported data, status code, headers).
        :raises: 404 if no exporter is found.
        """
        record = self._get_record(pid_value, allow_draft=is_preview, **kwargs)
        exports = None
        if self.config.model:
            exports = [export for export in self.config.model.exports if export.code.lower() == export_format.lower()]
        if not exports:
            abort(404, f"No exporter for code {export_format}")
            return None
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
        **kwargs: Any,
    ) -> tuple[Any, int, dict[str, str]] | None:
        """Export a record in the specified format."""
        return self._export(pid_value, export_format, **kwargs)

    @pass_route_args("view", "export")
    def export_preview(
        self,
        pid_value: str,
        export_format: str,
        **kwargs: Any,
    ) -> tuple[Any, int, dict[str, str]] | None:
        """Export a preview of a record in the specified format."""
        return self._export(pid_value, export_format, is_preview=True, **kwargs)

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
    @secret_link_or_login_required()
    @pass_draft(expand=True)
    @pass_draft_files
    @no_cache_response
    def deposit_edit(
        self,
        draft: RecordItem,
        draft_files: FileList | None = None,
        files_locked: bool = True,
        **kwargs: Any,  # noqa ARG002
    ) -> ResponseReturnValue:
        """Return edit page for a record."""
        service = self.api_service
        can_edit_draft = service.check_permission(g.identity, "update_draft", record=record_from_result(draft))
        can_preview_draft = service.check_permission(g.identity, "preview", record=record_from_result(draft))
        if not can_edit_draft:
            if can_preview_draft:
                return redirect(draft["links"]["preview_html"])
            raise PermissionDeniedError

        files_dict = None if draft_files is None else draft_files.to_dict()
        record = self.config.ui_serializer.dump_obj(copy.copy(draft.to_dict()))
        # TODO: implement edit action on published record (similar to RDM)

        form_config = self._get_form_config(g.identity, updateUrl=draft.links.get("self", None))
        form_config["ui_model"] = self.ui_model

        ui_links = self.expand_detail_links(identity=g.identity, record=draft)

        extra_context: dict[str, Any] = {}

        self.run_components(
            "form_config",
            api_record=draft,
            data=record,
            record=record,
            identity=g.identity,
            form_config=form_config,
            ui_links=ui_links,
            extra_context=extra_context,
        )
        self.run_components(
            "before_ui_edit",
            api_record=draft,
            record=record,
            data=record,
            form_config=form_config,
            ui_links=ui_links,
            identity=g.identity,
            extra_context=extra_context,
        )

        record["extra_links"] = {
            "ui_links": ui_links,
            "search_link": self.config.url_prefix,
        }

        render_kwargs = {
            "forms_config": form_config,
            "record": record,
            # TODO: implement communities
            "theme": None,
            "community": None,
            "community_ui": {},
            "community_use_jinja_header": False,
            "files": files_dict,
            "searchbar_config": {
                "searchUrl": url_for(f"{self.config.blueprint_name}.search"),
            },
            "files_locked": files_locked,
            "permissions": draft.has_permissions_to(
                [
                    "manage",
                    "new_version",
                    "delete_draft",
                    "manage_files",
                    "manage_record_access",
                ]
            ),
            # TODO: implement record deletion
            "extra_context": extra_context,
            "ui_links": ui_links,
            "context": current_oarepo_ui.catalog.jinja_env.globals,
            "d": FieldData.create(
                api_data=draft.to_dict(),
                ui_data=record,
                ui_definitions=self.ui_model,
                item_getter=self.config.field_data_item_getter,
            ),
        }

        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "deposit_edit",
            ),
            **render_kwargs,
        )

    def _get_form_config(self, identity: Identity, **kwargs: Any) -> dict[str, Any]:
        return self.config.form_config(identity=identity, **kwargs)

    def get_record_permissions(self, actions: list[str], record: Record | None = None) -> dict[str, bool]:
        """Generate (default) record action permissions."""
        service = self.api_service
        return {f"can_{action}": service.check_permission(g.identity, action, record=record) for action in actions}

    @login_required
    @no_cache_response
    @pass_query_args("create")
    def deposit_create(
        self,
        community: str | None = None,
        community_ui: dict | None = None,
        **kwargs: Any,
    ) -> ResponseReturnValue:
        """Return create page for a record."""
        if not self.has_deposit_permissions(g.identity):
            raise PermissionDeniedError(_("User does not have permission to create a record."))

        community_theme = None
        if community is not None and community_ui is not None:
            community_theme = community_ui.get("theme", {})

        community_use_jinja_header = bool(community_theme)
        dashboard_routes = current_app.config["APP_RDM_USER_DASHBOARD_ROUTES"]
        is_doi_required = current_app.config.get("RDM_PERSISTENT_IDENTIFIERS", {}).get("doi", {}).get("required")

        if not self.config.model:
            raise RuntimeError(f"Model {self.config.model_name} not registered, cannot resolve create URL")

        create_url = self.config.model.api_url("create")

        form_config = self._get_form_config(
            g.identity,
            dashboard_routes=dashboard_routes,
            createUrl=create_url,
            quota=get_actual_files_quota(None),
            hide_community_selection=community_use_jinja_header,
            is_doi_required=is_doi_required,
        )
        form_config["ui_model"] = self.ui_model
        ui_links: dict[str, str] = {}
        extra_context: dict[str, Any] = {}
        record = self.empty_record()
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

        self.run_components(
            "before_ui_create",
            data=record,
            record=None,
            api_record=None,
            form_config=form_config,
            identity=g.identity,
            extra_context=extra_context,
            ui_links=ui_links,
            **kwargs,
        )

        render_kwargs = {
            "theme": community_theme,
            "forms_config": form_config,
            "searchbar_config": {
                "searchUrl": url_for(f"{self.config.blueprint_name}.search"),
            },
            "record": record,
            "community": community,
            "community_ui": community_ui,
            "community_use_jinja_header": community_use_jinja_header,
            "files": {
                "default_preview": None,
                "entries": [],
                "links": {},
            },
            "preselectedCommunity": community_ui,
            "files_locked": False,
            "extra_context": extra_context,
            "ui_links": ui_links,
            "context": current_oarepo_ui.catalog.jinja_env.globals,
            "permissions": self.get_record_permissions(
                [
                    "manage",
                    "manage_files",
                    "delete_draft",
                    "manage_record_access",
                ]
            ),
        }

        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro(
                "deposit_create",
            ),
            **render_kwargs,
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
        if not self.config.model:
            raise RuntimeError(f"Model {self.config.model_name} not registered.")
        # TODO: this is not correct, we should maybe differentiate normal UIRecord and DraftUIRecord
        return cast("DraftService", self.config.model.service)

    @property
    def api_config(self) -> RecordServiceConfig:
        """Get the API service configuration for this resource."""
        if not self.config.model:
            raise RuntimeError(f"Model {self.config.model_name} not registered.")
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
            tpl.expand(identity, record_from_result(record)),
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
        **kwargs: Any,
    ) -> ResponseReturnValue:
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
                return not_found_error(error)
            if not isinstance(record_attr, dict):
                # record is not a dict, so we cannot get id from it
                return not_found_error(error)

            pid_value = record_attr.get("id", None)
            if pid_value is None:
                # record does not have id, so we cannot get it
                return not_found_error(error)
            record = self._get_record(pid_value, include_deleted=True, **kwargs)
            record_dict = record_from_result(record)
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
    ) -> ResponseReturnValue:
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

    def record_permission_denied_error(
        self,
        error: Exception,
        *args: Any,  # noqa: ARG002 for inheritance
        **kwargs: Any,  # noqa: ARG002 for inheritance
    ) -> ResponseReturnValue:
        """Handle permission denied error on record views."""
        if not current_user.is_authenticated:
            # trigger the flask-login unauthorized handler
            return Response(current_app.login_manager.unauthorized())  # type: ignore[attr-defined]

        record = getattr(error, "record", None)
        if record:
            is_restricted = record.get("access", {}).get("record", None) == "restricted"
            has_doi = "doi" in record.get("pids", {})
            if is_restricted and has_doi:
                return render_template(
                    "invenio_app_rdm/records/restricted_with_doi_tombstone.html",
                    record=record,
                ), 403

        return render_template(current_app.config["THEME_403_TEMPLATE"]), 403

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
