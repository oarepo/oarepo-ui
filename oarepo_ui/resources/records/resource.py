# SPDX-FileCopyrightText: 2022-2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Implementation of record ui resources."""

from __future__ import annotations

import copy
import logging
from dataclasses import asdict, is_dataclass
from functools import partial
from http import HTTPStatus
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
from invenio_app_rdm.records_ui.utils import evaluate_record_deletion, get_external_resources
from invenio_app_rdm.records_ui.views.decorators import no_cache_response
from invenio_app_rdm.records_ui.views.deposits import (
    VocabulariesOptions,
    get_user_communities_memberships,
    load_custom_fields,
)
from invenio_app_rdm.records_ui.views.records import (
    PreviewFile,
    not_found_error,
)
from invenio_communities.communities.resources.serializer import (
    UICommunityJSONSerializer,
)
from invenio_communities.errors import CommunityDeletedError
from invenio_communities.proxies import current_communities
from invenio_i18n import gettext as _
from invenio_pidstore.errors import PersistentIdentifierError
from invenio_previewer import current_previewer
from invenio_previewer.extensions import default as default_previewer
from invenio_rdm_records.proxies import current_rdm_records
from invenio_rdm_records.records.api import RDMRecord
from invenio_rdm_records.records.systemfields.access.access_settings import (
    AccessSettings,
)
from invenio_rdm_records.services.errors import RecordDeletedException
from invenio_rdm_records.services.services import RDMRecordService
from invenio_records_resources.pagination import Pagination
from invenio_records_resources.services import LinksTemplate
from invenio_records_resources.services.errors import (
    PermissionDeniedError,
)
from invenio_stats.proxies import current_stats
from invenio_users_resources.proxies import current_user_resources
from marshmallow import ValidationError
from oarepo_runtime.api import ExportEngine, ExportRepresentation
from oarepo_runtime.typing import record_from_result
from werkzeug import Response
from werkzeug.exceptions import Forbidden, HTTPException

from oarepo_ui.resources.decorators import (
    pass_draft,
    pass_draft_community,
    pass_draft_files,
    pass_query_args,
    pass_record_files,
    pass_record_latest,
    pass_record_media_files,
    pass_record_or_draft,
    pass_route_args,
    record_content_negotiation,
    response_header_signposting,
    secret_link_or_login_required,
)
from oarepo_ui.utils import dump_empty

# Resource
#
from ...proxies import current_oarepo_ui
from ...templating.data import FieldData
from ..base import UIResource, multiple_methods_route
from ..utils import get_form_files_quota, set_api_record_to_response
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
                view = getattr(self, route_name)
                methods = getattr(view, "_http_methods", ["GET"])
                if len(methods) > 1:
                    routes.append(multiple_methods_route(methods, route_url_with_prefix, view))
                else:
                    routes.append(route(methods[0], route_url_with_prefix, view))
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
        record.setdefault("expanded", {})
        record["status"] = "draft"
        self.run_components("empty_record", empty_data=record, **kwargs)
        return record

    @property
    def ui_model(self) -> Mapping[str, Any]:
        """Get the UI model for the resource."""
        # mypy seems to ignore the type in runtime, thus added ignore
        if not self.config.model:
            return {}
        return self.config.model.ui_model

    def _record_from_service_result(self, result: RecordItem) -> Record:
        return record_from_result(result)

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
            if access is None:
                access = parent["access"] = {}
            if access.get("settings") is None:
                access["settings"] = AccessSettings({}).dump()

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

    def _get_record_requests(self, record: RecordItem) -> dict[str, str]:
        """Return the community requests of a record as ``{community_id: request_id}``.

        Mirrors ``record_requests`` of invenio-app-rdm's ``record_detail``. Community requests exist
        only for RDM services and records whose parent has communities, so any other model (e.g. a
        plain drafts service) gets an empty mapping instead of an error.
        """
        if not isinstance(self.api_service, RDMRecordService):
            return {}
        parent = getattr(record_from_result(record), "parent", None)
        if parent is None or getattr(parent, "communities", None) is None:
            return {}
        return cast(
            "dict[str, str]",
            current_rdm_records.record_communities_service.get_record_requests(g.identity, record),
        )

    def _evaluate_record_deletion(
        self, record: RecordItem, *, with_options: bool = True
    ) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        """Evaluate record deletion for the current identity, mirroring invenio-app-rdm.

        Record deletion (immediate deletion and deletion requests) is an RDM-only feature,
        so for non-RDM services an empty evaluation and no removal reasons are returned.
        Note that oarepo/NRP repositories normally delete published records through the
        oarepo-requests ``delete_published_record`` request; the RDM flow stays inactive
        unless ``RDM_IMMEDIATE_RECORD_DELETION_ENABLED`` / ``RDM_REQUEST_RECORD_DELETION_ENABLED``
        are switched on (both default to False).

        :param record: The record (or draft) result item to evaluate.
        :param with_options: Load the deletion removal reasons vocabulary when deletion is allowed.
            Callers that already have the reasons (e.g. from ``VocabulariesOptions().dump()``) pass False.
        :return: Tuple of ``(record_deletion, record_deletion_options)``.
        """
        if not isinstance(self.api_service, RDMRecordService):
            return {}, []
        record_deletion: dict[str, Any] = evaluate_record_deletion(record_from_result(record, RDMRecord), g.identity)
        policy_results = record_deletion.get("recordDeletion")
        if isinstance(policy_results, dict):
            # flatten PolicyEvaluator.Result dataclasses to plain dicts so ``| tojson`` in the
            # templates never depends on the JSON provider (same as oarepo-rdm FileModificationComponent)
            record_deletion["recordDeletion"] = {
                key: asdict(value) if is_dataclass(value) and not isinstance(value, type) else value
                for key, value in policy_results.items()
            }
        # The deletion options are only needed if the user is allowed to delete the given record.
        record_deletion_options: list[dict[str, Any]] = (
            VocabulariesOptions().deletion_request_removal_reasons()
            if with_options and record_deletion.get("allowed")
            else []
        )
        return record_deletion, record_deletion_options

    def _validate_draft_preview(self, record: RecordItem) -> None:
        """Validate draft structure."""
        try:
            self.api_service.validate_draft(g.identity, record.id, ignore_field_permissions=True)
        except ValidationError:
            abort(404)

    def _get_custom_fields_ui(self, record: RecordItem, record_ui: dict[str, Any]) -> list[dict[str, Any]]:
        """Return the custom fields UI sections shown on the record landing page.

        The model-specific configuration (``RecordsUIResourceConfig.landing_page_custom_fields``, i.e.
        ``<MODEL>_CUSTOM_FIELDS_UI`` for oarepo-model custom fields) is preferred. If it yields nothing,
        the record has custom field values, the model is served by an RDM service and the model does not
        declare its own custom fields relation (so its RDM base schema validates against
        ``RDM_CUSTOM_FIELDS``), fall back to the global ``RDM_CUSTOM_FIELDS_UI`` configuration exactly like
        invenio-app-rdm ``record_detail`` does. Sections flagged with ``hide_from_landing_page`` are dropped.

        :param record: API record item being rendered.
        :param record_ui: UI-serialized record.
        :return: List of custom field UI sections with field paths relative to ``custom_fields``.
        """
        record_custom_fields = record_ui.get("custom_fields")
        ui_data = record_ui.get("ui")
        if record_custom_fields and not (isinstance(ui_data, dict) and isinstance(ui_data.get("custom_fields"), dict)):
            # landing page templates render values from record_ui["ui"]["custom_fields"]; if the UI serializer
            # does not produce it, details.html would fail on an undefined value, so render no sections
            return []
        custom_fields_ui = self.config.landing_page_custom_fields(
            identity=g.identity,
            api_record=record,
            record=record_ui,
        )
        if custom_fields_ui or not record_custom_fields or not isinstance(self.api_service, RDMRecordService):
            # no values -> details.html renders no section, so skip loading RDM config (vocabulary lookups)
            return custom_fields_ui
        if any(key != "RDM_CUSTOM_FIELDS" for key in self.config.custom_fields_config_keys()):
            # the model validates custom fields against its own <MODEL>_CUSTOM_FIELDS, RDM config does not apply
            return custom_fields_ui
        rdm_sections = cast("list[dict[str, Any]]", load_custom_fields()["ui"])
        return [cf for cf in rdm_sections if not cf.get("hide_from_landing_page", False)]

    def _read_community(self, community_id: str) -> RecordItem | None:
        """Read a community by its id, returning None when it cannot be shown.

        The community service is global (not tied to the model's service), so this works for
        any model. Deleted communities (tombstones), unknown/deleted PIDs and communities the
        current identity is not allowed to read yield None instead of failing the page.

        :param community_id: Community id (UUID) or slug.
        :return: Community result item or None.
        """
        try:
            return cast(
                "RecordItem",
                current_communities.service.read(id_=community_id, identity=g.identity),
            )
        except CommunityDeletedError, PersistentIdentifierError, PermissionDenied:
            return None

    def _get_record_community(self, record_ui: Mapping[str, Any]) -> tuple[RecordItem | None, str | None]:
        """Return the record's active community, adapted from invenio-app-rdm ``get_record_community``.

        A record has an active community when its parent has either a review request
        addressed to a community or a default community, and that community is neither
        a ghost (deleted PID) nor deleted (tombstone). Records of models without
        communities (no ``parent.communities``/``parent.review``) never hit the
        community service.

        :param record_ui: UI-serialized record (expanded).
        :return: Tuple of the resolved community (or None) and the community id (or None).
        """
        parent = record_ui.get("parent") or {}
        community_review = ((parent.get("review") or {}).get("receiver") or {}).get("community")
        community_default = (parent.get("communities") or {}).get("default")
        community_id = cast("str | None", community_default or community_review)
        if not community_id:
            return None, None

        expanded_parent = (record_ui.get("expanded") or {}).get("parent") or {}
        expanded_community = (
            (expanded_parent.get("review") or {}).get("receiver")
            or (expanded_parent.get("communities") or {}).get("default")
            or {}
        )
        if expanded_community.get("is_ghost", False):
            # community pid is not found in search i.e. its pid is deleted
            return None, community_id

        # resolve the community again to check the deletion status: deleted communities
        # with tombstones are not identified as ghost records by the expansion
        return self._read_community(community_id), community_id

    def _get_draft_community(
        self, record_ui: Mapping[str, Any]
    ) -> tuple[Any, dict[str, Any] | None, dict[str, Any] | None]:
        """Resolve the community shown on the deposit edit page, adapted from invenio-app-rdm ``deposit_edit``.

        The community is taken from, in order of priority:
          1. the draft's parent's review receiver (deprecated ``parent.review``),
          2. the draft's review receiver,
          3. the draft's parent's default community (new versions of published records).

        :param record_ui: UI-serialized draft (expanded).
        :return: Tuple ``(community, community_ui, community_theme)``. When the community cannot
            be read (deleted, missing or not accessible), ``community`` is left as the expanded
            community dict (as upstream does) and ``community_ui``/``community_theme`` are None.
        """
        expanded = record_ui.get("expanded") or {}
        expanded_parent = expanded.get("parent") or {}
        community = (
            (expanded_parent.get("review") or {}).get("receiver")
            or (expanded.get("review") or {}).get("receiver")
            or (expanded_parent.get("communities") or {}).get("default")
        )
        if not isinstance(community, dict) or not community.get("id"):
            return community, None, None

        # upstream v14 keeps a "TODO: handle deleted community" here as well
        resolved = self._read_community(community["id"])
        if resolved is None:
            return community, None, None
        community_dict = resolved.to_dict()
        community_ui = cast("dict[str, Any]", UICommunityJSONSerializer().dump_obj(community_dict))
        return resolved, community_ui, community_dict.get("theme", {})

    def _detail(  # noqa: PLR0913, PLR0917 too many arguments
        self,
        record: RecordItem,
        files: FileList,
        media_files: FileList,
        is_preview: bool = False,
        include_deleted: bool = False,
        embed: bool = False,
        preview_file: str | None = None,
        **kwargs: Any,
    ) -> Response:
        """Return detail page for a record (core logic without decorators)."""
        files_dict, media_files_dict = self._prepare_files(files, media_files)
        record_ui = self._prepare_record_ui(record)

        if preview_file:
            # same as invenio-app-rdm record_detail: ?preview_file=<key> overrides the file previewed by default
            files_ui = record_ui.get("files")
            if isinstance(files_ui, dict):
                files_ui["default_preview"] = preview_file

        is_draft = record_ui.get("is_draft", False)
        avatar = self._get_user_avatar()
        custom_fields_ui = self._get_custom_fields_ui(record, record_ui)

        if is_preview and is_draft:
            # it is possible to save incomplete drafts that break the normal
            # (preview) landing page rendering
            # to prevent this from happening, we validate the draft's structure
            # see: https://github.com/inveniosoftware/invenio-app-rdm/issues/1051
            self._validate_draft_preview(record)

        # emit a record view stats event
        emitter = current_stats.get_event_emitter("record-view")
        if record is not None and emitter is not None:
            emitter(current_app, record=record_from_result(record), via_api=False)

        record_owner = record_ui.get("expanded", {}).get("parent", {}).get("access", {}).get("owned_by", {})
        resolved_community, _community_id = self._get_record_community(record_ui)
        resolved_community_ui = (
            cast("dict[str, Any]", UICommunityJSONSerializer().dump_obj(resolved_community.to_dict()))
            if resolved_community
            else None
        )
        theme = resolved_community_ui.get("theme", {}) if resolved_community_ui else None

        ui_links = self.expand_detail_links(identity=g.identity, record=record)
        record_deletion, record_deletion_options = self._evaluate_record_deletion(record)
        extra_context: dict[str, Any] = {}
        render_kwargs: dict[str, Any] = {
            "record": record,
            "record_ui": record_ui,
            "files": files_dict,
            "media_files": media_files_dict,
            "user_communities_memberships": get_user_communities_memberships(),
            "custom_fields_ui": custom_fields_ui,
            "is_preview": is_preview,
            "include_deleted": include_deleted,
            "embedded": embed,
            "is_draft": is_draft,
            "community": resolved_community,
            "community_ui": resolved_community_ui,
            "theme": theme,
            "record_requests": self._get_record_requests(record),
            "external_resources": (
                get_external_resources(record)
                if current_app.config.get("APP_RDM_RECORD_LANDING_PAGE_EXTERNAL_LINKS")
                else []
            ),
            "user_avatar": avatar,
            "record_deletion": record_deletion,
            "record_deletion_options": record_deletion_options,
            "model": self.config.model,
            "model_name": self.config.model_name,
            # record created with system_identity have not owners e.g demo
            "record_owner_id": record_owner.get("id"),
            # JinjaX support
            "context": current_oarepo_ui.catalog.jinja_env.globals,
            "ui_links": ui_links,
            "extra_context": extra_context,
            "d": FieldData.create(
                api_data=record.to_dict() if record else {},
                ui_data=record_ui,
                ui_definitions=self.ui_model,
                item_getter=self.config.field_data_item_getter,
            ),
        }

        self.run_components(
            "before_ui_detail",
            api_record=record,
            record=record,
            files=files_dict,
            media_files=media_files_dict,
            identity=g.identity,
            ui_links=ui_links,
            extra_context=extra_context,
            render_kwargs=render_kwargs,
            **kwargs,
        )

        # Upstream renders through ``render_community_theme_template(..., theme=theme)``, whose only effect is
        # to overlay the Jinja loader so that ``themes/<brand>/...`` (then ``themes/default/...``) template
        # overrides win. Pages here are rendered by the shared, cached JinjaX catalog environment, so those
        # brand-specific template overrides are intentionally not applied; the community branding itself
        # (theme CSS link and community header) is driven by the ``community``/``theme`` kwargs in the
        # upstream ``records/detail.html`` that the model templates extend.
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
    @pass_query_args("record_detail")
    @pass_record_or_draft(expand=True)
    @ExportEngine.with_export_cache
    @record_content_negotiation
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
        **kwargs: Any,
    ) -> Response:
        """Record detail page (aka landing page) adapted from invenio-app-rdm view."""
        return self._detail(record, files, media_files, is_preview, include_deleted, **kwargs)

    @pass_route_args("view")
    @pass_record_latest
    def record_latest(self, record: RecordItem, **kwargs: Any) -> Response:  # noqa: ARG002
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
        for plugin in current_previewer.iter_previewers(previewers=[file_previewer] if file_previewer else None):
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
            service = self.api_service
            if allow_draft:
                return cast("RecordItem", service.read_draft(g.identity, pid_value, expand=True))
            if include_deleted and isinstance(service, RDMRecordService):
                # only the RDM service's ``read`` supports deleted records
                return cast(
                    "RecordItem",
                    service.read(g.identity, pid_value, expand=True, include_deleted=include_deleted),
                )
            return service.read(g.identity, pid_value, expand=True)
        except PermissionDenied as e:
            raise Forbidden(str(e)) from e

    def search_without_slash(self) -> Response:
        """Redirect search request without trailing slash to the one with slash."""
        split_path = request.full_path.split("?", maxsplit=1)
        path_with_slash = split_path[0] + "/"
        if len(split_path) == 1:
            return redirect(path_with_slash, code=302)
        return redirect(path_with_slash + "?" + split_path[1], code=302)

    def _search(self, page: int = 1, size: int = 10, **kwargs: Any) -> ResponseReturnValue:
        """Return search page (core logic without decorators)."""
        pagination = Pagination(
            size,
            page,
            # we should present all links
            # (but do not want to get the count as it is another request to Opensearch)
            (page + 1) * size,
        )
        ui_links = self.expand_search_links(g.identity, pagination, **kwargs)

        overridable_id_prefix = f"{self.config.application_id.capitalize()}.Search"
        webpack_entry = f"{self.config.model_name}_search.js"

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
            webpack_entry=webpack_entry,
            extra_context=extra_context,
            **kwargs,
        )

        search_config = partial(self.config.search_app_config, **search_options)

        search_app_config = search_config(app_id=self.config.application_id.capitalize())

        render_kwargs: dict[str, Any] = {
            "search_app_config": search_app_config,
            "ui_config": self.config,
            "ui_resource": self,
            "ui_links": ui_links,
            "webpack_entry": webpack_entry,
            "extra_context": extra_context,
            "context": current_oarepo_ui.catalog.jinja_env.globals,
            "model_name": self.config.model_name,
        }

        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro("search"),
            **render_kwargs,
        )

    @pass_query_args("search")
    def search(self, page: int = 1, size: int = 10, **kwargs: Any) -> ResponseReturnValue:
        """Return search page."""
        return self._search(page, size, **kwargs)

    @pass_route_args("view", "record_export")
    @pass_query_args("record_detail")
    @pass_record_or_draft(expand=True)
    def record_export(
        self,
        record: RecordItem,
        export_format: str,
        **kwargs: Any,  # noqa: ARG002
    ) -> tuple[Any, int, dict[str, str]]:
        """Export page view."""
        try:
            return ExportEngine.export(
                record_dict=record.to_dict(),
                representation=ExportRepresentation.RESPONSE,
                export_code=export_format.lower(),
            )
        except ValueError:
            abort(404, f"No exporter for code {export_format}")
            raise
        except HTTPException as e:
            # a streamed export (e.g. an archive) checks everything before streaming; show why it failed
            # instead of the generic 500 page. A `files` attribute lists the files that can not be read.
            if e.code is None or e.code < 500:  # noqa: PLR2004 server errors only
                raise
            return (
                render_template(
                    "oarepo_ui/export_error.html",
                    export_format=export_format,
                    files=getattr(e, "files", None),
                    record_url=record.links.get("self_html"),
                ),
                e.code,
                {},
            )

    def _edit(
        self,
        draft: RecordItem,
        draft_files: FileList | None = None,
        files_locked: bool = True,
        **kwargs: Any,
    ) -> Response:
        """Return edit page for a record (core logic without decorators)."""
        files_dict = None if draft_files is None else draft_files.to_dict()
        record = self.config.ui_serializer.dump_obj(copy.copy(draft.to_dict()))
        # TODO: implement edit action on published record (similar to RDM)

        community, community_ui, community_theme = self._get_draft_community(record)
        # show the community branded header when the community has a theme; the react
        # community selection component is hidden in that case (upstream parity)
        community_use_jinja_header = bool(community_theme)

        dashboard_routes = current_app.config.get("APP_RDM_USER_DASHBOARD_ROUTES", {})
        if "uploads" not in dashboard_routes:
            log.warning(
                "APP_RDM_USER_DASHBOARD_ROUTES dictionary not set up in configuration "
                "or 'uploads' key not in the dictionary"
            )
        form_config = self._get_form_config(
            g.identity,
            dashboard_routes=dashboard_routes,
            updateUrl=draft.links.get("self", None),
            hide_community_selection=community_use_jinja_header,
            # upstream deposit_edit: quota=get_actual_files_quota(draft._record), shaped by get_form_config
            quota=get_form_files_quota(
                record_from_result(draft),
                g.identity,
                rdm=isinstance(self.api_service, RDMRecordService),
            ),
        )
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
            **kwargs,
        )

        # Record deletion is evaluated against the published record (if any), like
        # invenio-app-rdm deposit_edit. Unpublished drafts and non-RDM services get {}.
        record_deletion: dict[str, Any] = {}
        service = self.api_service
        if record.get("is_published") and isinstance(service, RDMRecordService):
            published_record = service.read(g.identity, draft.id)
            # upstream ships the removal reasons in forms_config["vocabularies"]; components such as
            # oarepo-rdm RDMVocabularyOptionsComponent already put them there via VocabulariesOptions().dump()
            vocabularies = form_config.setdefault("vocabularies", {})
            has_reasons = isinstance(vocabularies, dict) and "deletion_request_removal_reasons" in vocabularies
            record_deletion, record_deletion_options = self._evaluate_record_deletion(
                published_record, with_options=not has_reasons
            )
            if record_deletion_options and isinstance(vocabularies, dict):
                vocabularies["deletion_request_removal_reasons"] = record_deletion_options

        record["extra_links"] = {
            "ui_links": ui_links,
            "search_link": self.config.url_prefix,
        }

        render_kwargs: dict[str, Any] = {
            "forms_config": form_config,
            "record": record,
            "theme": community_theme,
            "community": community,
            "community_ui": community_ui,
            "community_use_jinja_header": community_use_jinja_header,
            "files": files_dict,
            "searchbar_config": {
                "searchUrl": url_for(f"{self.config.blueprint_name}.search"),
            },
            "files_locked": files_locked,
            "record_deletion": record_deletion,
            "extra_context": extra_context,
            "ui_links": ui_links,
            "webpack_entry": f"{self.config.model_name}_deposit_form.js",
            "context": current_oarepo_ui.catalog.jinja_env.globals,
            "d": FieldData.create(
                api_data=draft.to_dict(),
                ui_data=record,
                ui_definitions=self.ui_model,
                item_getter=self.config.field_data_item_getter,
            ),
            "model_name": self.config.model_name,
        }

        self.run_components(
            "before_ui_edit",
            api_record=draft,
            record=record,
            data=record,
            form_config=form_config,
            ui_links=ui_links,
            identity=g.identity,
            extra_context=extra_context,
            render_kwargs=render_kwargs,
            **kwargs,
        )

        response = Response(
            current_oarepo_ui.catalog.render(
                self.get_jinjax_macro("deposit_edit"),
                **render_kwargs,
            ),
            mimetype="text/html",
            status=200,
        )
        set_api_record_to_response(response, draft)
        return response

    @pass_route_args("view")
    @secret_link_or_login_required()
    @pass_draft(expand=True)
    @pass_draft_files
    @no_cache_response
    @response_header_signposting
    def deposit_edit(
        self,
        draft: RecordItem,
        draft_files: FileList | None = None,
        files_locked: bool = True,
        **kwargs: Any,
    ) -> Response:
        """Return edit page for a record."""
        service = self.api_service
        can_edit_draft = service.check_permission(g.identity, "update_draft", record=record_from_result(draft))
        can_preview_draft = service.check_permission(g.identity, "preview", record=record_from_result(draft))
        if not can_edit_draft:
            if can_preview_draft:
                return redirect(draft["links"]["preview_html"])
            raise PermissionDeniedError
        return self._edit(draft, draft_files, files_locked, **kwargs)

    def get_jinjax_macro(
        self,
        template_type: str,
        default_macro: str | None = None,
    ) -> str:
        """Return which jinjax macro should be used for rendering the template.

        Name of the macro may include optional namespace in the form of "namespace.Macro".

        :param template_type: Type of template to render (e.g., 'detail', 'search').
        :param default_macro: Default macro name if template not in config.
        :return: Macro name string.
        :raises KeyError: If template is not found and no default_macro provided.
        """
        tmpl = self.config.templates.get(template_type, default_macro)
        if not tmpl:
            raise KeyError(f"Template {template_type} not found and default macro was not provided.")
        return tmpl

    def _get_form_config(self, identity: Identity, **kwargs: Any) -> dict[str, Any]:
        return self.config.form_config(identity=identity, **kwargs)

    def _create(
        self,
        community: str | None = None,
        community_ui: dict | None = None,
        **kwargs: Any,
    ) -> ResponseReturnValue:
        """Return create page for a record (core logic without decorators)."""
        community_theme = None
        if community is not None and community_ui is not None:
            community_theme = community_ui.get("theme", {})

        community_use_jinja_header = bool(community_theme)
        dashboard_routes = current_app.config.get("APP_RDM_USER_DASHBOARD_ROUTES", {})
        if "uploads" not in dashboard_routes:
            log.warning(
                "APP_RDM_USER_DASHBOARD_ROUTES dictionary not set up in configuration "
                "or 'uploads' key not in the dictionary"
            )

        if not self.config.model:
            raise RuntimeError(f"Model {self.config.model_name} not registered, cannot resolve create URL")

        create_url = self.config.model.api_url("create", **kwargs)

        form_config = self._get_form_config(
            g.identity,
            dashboard_routes=dashboard_routes,
            createUrl=create_url,
            # upstream deposit_create: quota=get_actual_files_quota(None), shaped by get_form_config
            quota=get_form_files_quota(None, g.identity, rdm=isinstance(self.api_service, RDMRecordService)),
            hide_community_selection=community_use_jinja_header,
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

        render_kwargs: dict[str, Any] = {
            "theme": community_theme,
            "forms_config": form_config,
            "searchbar_config": {
                "searchUrl": url_for(f"{self.config.blueprint_name}.search", **kwargs),
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
            "webpack_entry": f"{self.config.model_name}_deposit_form.js",
            "context": current_oarepo_ui.catalog.jinja_env.globals,
            "model_name": self.config.model_name,
        }

        self.run_components(
            "before_ui_create",
            data=record,
            record=None,
            api_record=None,
            form_config=form_config,
            identity=g.identity,
            extra_context=extra_context,
            ui_links=ui_links,
            render_kwargs=render_kwargs,
            **kwargs,
        )

        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro("deposit_create"),
            **render_kwargs,
        )

    @login_required
    @no_cache_response
    @pass_query_args("create")
    @pass_draft_community
    def deposit_create(
        self,
        community: str | None = None,
        community_ui: dict | None = None,
        **kwargs: Any,
    ) -> ResponseReturnValue:
        """Return create page for a record."""
        if not self.has_deposit_permissions(g.identity):
            raise PermissionDeniedError(_("User does not have permission to create a record."))
        return self._create(community, community_ui, **kwargs)

    def has_deposit_permissions(self, identity: Identity) -> bool:
        """Check if the identity has deposit permissions for creating records.

        :param identity: User identity object.
        :return: True if deposit is allowed, False otherwise.
        """
        # check if permission policy contains a specialized "view_deposit_page" permission
        # and if so, use it, otherwise use the generic "can_create" permission
        permission_policy = self.api_service.permission_policy("view_deposit_page")
        if hasattr(permission_policy, "can_view_deposit_page"):
            return self.api_service.check_permission(identity, "view_deposit_page", record=None)
        return self.api_service.check_permission(identity, "create", record=None)

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
        return tpl.expand(identity, record_from_result(record))

    def expand_search_links(self, identity: Identity, pagination: Pagination, **kwargs: Any) -> dict[str, str]:
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
                    **kwargs,
                    "page": pagination.page,
                    "size": pagination.size,
                },
            },
        )
        return tpl.expand(identity, pagination)

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

        pid_value = getattr(error, "pid_value", None) or getattr(error, "pid", None)
        tombstone_render_kwargs: dict[str, Any] = {
            "pid": pid_value,
            "tombstone": tombstone_dict,
            "model_name": self.config.model_name,
        }
        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro("tombstone", default_macro="Tombstone"),
            **tombstone_render_kwargs,
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
        pid_value = getattr(error, "pid_value", None) or getattr(error, "pid", None)
        not_found_render_kwargs: dict[str, Any] = {
            "pid": pid_value,
            "model_name": self.config.model_name,
        }
        return current_oarepo_ui.catalog.render(
            self.get_jinjax_macro("not_found", default_macro="NotFound"),
            **not_found_render_kwargs,
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
            # flask-login attaches the login manager to the app dynamically
            return cast("Any", current_app).login_manager.unauthorized()

        record = getattr(error, "record", None)
        if record:
            is_restricted = record.get("access", {}).get("record", None) == "restricted"
            has_doi = "doi" in record.get("pids", {})
            if is_restricted and has_doi:
                return (
                    render_template(
                        "invenio_app_rdm/records/restricted_with_doi_tombstone.html",
                        record=record,
                    ),
                    403,
                )

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
    just_for_translations = [
        _("Removal reason"),
        _("Note"),
        _("Citation text"),
    ]
