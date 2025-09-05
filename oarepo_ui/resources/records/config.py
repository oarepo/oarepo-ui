#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Configuration class for record UI resources."""

from __future__ import annotations

import inspect
from typing import TYPE_CHECKING, Any, NotRequired, TypedDict, cast

import marshmallow as ma
from flask import current_app
from flask_resources.parsers import MultiDictSchema
from flask_resources.serializers import MarshmallowSerializer
from invenio_pidstore.errors import (
    PIDDeletedError,
    PIDDoesNotExistError,
    PIDUnregistered,
)
from invenio_rdm_records.services.errors import RecordDeletedException
from invenio_records.systemfields.relations import MultiRelationsField
from invenio_records_resources.services import (
    EndpointLink,
    Link,
    RecordEndpointLink,
    pagination_endpoint_links,
)
from invenio_records_resources.services.errors import (
    FileKeyNotFoundError,
    PermissionDeniedError,
)
from invenio_search.engine import dsl
from invenio_search_ui.searchconfig import FacetsConfig, SearchAppConfig, SortConfig
from invenio_vocabularies.records.systemfields.relations import CustomFieldsRelation
from marshmallow import Schema, fields, post_load, validate
from oarepo_runtime import current_runtime
from oarepo_runtime.services.facets.params import GroupedFacetsParam

from ..base import UIResourceConfig

if TYPE_CHECKING:
    from collections.abc import Mapping

    from flask.typing import ErrorHandlerCallable
    from invenio_access.permissions import Identity
    from invenio_records_resources.pagination import Pagination
    from invenio_records_resources.services.records.config import (
        RecordServiceConfig,
    )
    from invenio_search.engine import dsl
    from oarepo_runtime.api import Model
    from werkzeug.datastructures import MultiDict

    from oarepo_ui.templating.data import (
        FieldDataItemGetter,
    )

    from ..components.base import UIResourceComponent


class SearchRequestArgsSchema(MultiDictSchema):
    """Request URL query string arguments for listing records."""

    q = fields.String()
    suggest = fields.String()
    sort = fields.String()
    page = fields.Integer()
    size = fields.Integer()

    # TODO: do we support the layout parameter?
    layout = fields.String(validate=validate.OneOf(["grid", "list"]))

    @post_load(pass_original=True)
    def facets(self, data: dict[str, Any], original_data: MultiDict[str, Any], **_kwargs: Any) -> dict[str, Any]:
        """Extract facet filters from 'f=facetName:facetValue' style arguments."""
        for value in original_data.getlist("f"):
            if ":" in value:
                key, val = value.split(":", 1)
                data.setdefault("facets", {}).setdefault(key, []).append(val)
        return data


class LabeledBucket(TypedDict):
    """A bucket with a label and document count for use in UI facets."""

    key: str
    label: NotRequired[str]
    doc_count: NotRequired[int]


class LabeledAggregation(TypedDict):
    """A labeled aggregation for use in UI facets."""

    label: NotRequired[str]
    buckets: list[LabeledBucket]


def remove_pagination_args(_pagination: Pagination, context_variables: dict[str, Any]) -> None:
    """Remove pagination-related arguments from the request vars."""
    context_variables.pop("args", None)


class RecordsUIResourceConfig(UIResourceConfig):
    """Configuration for the UI resource that renders record pages.

    Renders record detail, edit, create, search, and preview pages.
    """

    routes: Mapping[str, str] = {
        "search": "",
        "create": "/_new",
        "detail": "/<pid_value>",
        "latest": "/<pid_value>/latest",
        "edit": "/<pid_value>/edit",
        "export": "/<pid_value>/export/<export_format>",
        "export_preview": "/<pid_value>/preview/export/<export_format>",
        "preview": "/<pid_value>/preview",
        "published_file_preview": "/<pid_value>/files/<path:filepath>/preview",
        "draft_file_preview": "/<pid_value>/preview/files/<path:filepath>/preview",
    }
    """Routes for the resource, mapping route names to URL patterns."""

    config_url_prefix = "/configs"
    """URL prefix for configuration routes."""

    # TODO: look at this how the form config should be handled
    config_routes: Mapping[str, str] = {
        "form_config": "form",
    }
    """Configuration routes for the resource, mapping route names to URL patterns."""

    request_view_args: type[Schema] = MultiDictSchema.from_dict({"pid_value": ma.fields.Str()})
    """Request arguments for viewing a record, including the PID value."""

    request_file_view_args: type[Schema] = MultiDictSchema.from_dict(
        {
            **request_view_args().fields,
            "filepath": ma.fields.Str(),
        }
    )
    """Request arguments for viewing a file associated with a record, including the file path."""

    request_export_args: type[Schema] = MultiDictSchema.from_dict({"export_format": ma.fields.Str()})
    """Request arguments for exporting a record, including the export format.
    Currently it only supports ?export_format=xyz"""

    request_search_args: type[Schema] = SearchRequestArgsSchema
    """Request arguments for searching records, including query, sort, page, and size."""

    request_create_args: type[Schema] = MultiDictSchema.from_dict(
        {
            # TODO: should not be here, define it in oarepo-communities inside the
            # RecordsWithingCommunityUIResourceConfig
            # "selected_community": ma.fields.Str()
        }
    )
    """Request arguments for creating a record."""

    request_embed_args: type[Schema] = MultiDictSchema.from_dict({"embed": ma.fields.Bool()})
    """Request arguments for embedding record page inside a dialogue or another page.
    This is represented in the URL as ?embed=true.
    """

    request_form_config_view_args: type[Schema] = MultiDictSchema
    """Request arguments for form configuration view, currently empty."""

    model_name: str
    """Name of the API model that this resource is based on."""

    # TODO: can we use model_name for application_id?
    application_id = "Default"
    """Namespace of the React app components related to this resource."""

    templates: Mapping[str, str | None] = {
        "detail": None,
        "search": None,
        "edit": None,
        "create": None,
        "preview": None,
    }
    """Templates used for rendering the UI. It is a name of a jinjax macro that renders the UI"""

    empty_record: Mapping[str, Any] = {}
    """Initial empty record data used when creating a new record."""

    error_handlers: Mapping[type[Exception], str | ErrorHandlerCallable] = {
        PIDDeletedError: "tombstone",
        RecordDeletedException: "tombstone",
        PIDDoesNotExistError: "not_found",
        PIDUnregistered: "not_found",
        KeyError: "not_found",
        FileKeyNotFoundError: "not_found",
        PermissionDeniedError: "permission_denied",
    }
    """Error handlers for specific exceptions, mapping exceptions to template names."""

    field_data_item_getter: FieldDataItemGetter | None = None
    """Field data item getter for retrieving field data items in the UI.
    If not set, the default getter will be used."""

    # TODO: this property should be refactored due to changes to component overrides
    @property
    def default_components(self) -> dict[str, UIResourceComponent]:
        """Return default UI components for the resource, based on the record schema and component.

        :return: Dictionary mapping schema value to component.
        """
        service = self.model.service
        schema = getattr(service.record_cls, "schema", None)
        component = getattr(self, "search_component", None)
        if schema and component:
            return {schema.value: component}
        return {}

    @property
    def ui_links_item(self) -> Mapping[str, EndpointLink]:
        """Return UI links for item detail, edit, and search."""
        return {
            "self": RecordEndpointLink(f"{self.blueprint_name}.detail"),
            "edit": RecordEndpointLink(f"{self.blueprint_name}.edit"),
            "search": EndpointLink(f"{self.blueprint_name}.search"),
        }

    @property
    def ui_links_search(self) -> Mapping[str, Link | EndpointLink]:
        """Return UI search links for pagination and creation.

        :return: Dictionary of search-related links.
        """
        return {
            **pagination_endpoint_links(f"{self.blueprint_name}.search"),
            "create": EndpointLink(
                f"{self.blueprint_name}.create",
                # ignore pagination etc from this link
                vars=remove_pagination_args,
            ),
        }

    @property
    def model(self) -> Model:
        """Return the model name for the resource.

        :return: Model name as a string.
        """
        if not self.model_name:
            raise ValueError("Model name is not set in the resource configuration.")
        return current_runtime.models[self.model_name]

    @property
    def ui_serializer(self) -> MarshmallowSerializer:
        """Return an instance of the UI serializer class.

        :return: UI serializer instance.
        """
        serializer = next(x for x in self.model.exports if x.code == "ui_json").serializer
        if not serializer:
            raise ValueError(f"UI serializer is not set for model {self.model.code}.")
        if not isinstance(serializer, MarshmallowSerializer):
            raise TypeError(f"UI serializer must be an instance of MarshmallowSerializer, got {type(serializer)}.")
        return serializer

    def search_available_facets(self, api_config: RecordServiceConfig, identity: Identity) -> dict[str, dsl.Facet]:
        """Return available facets for search, possibly using a grouped facets parameter class.

        :param api_config: API configuration object.
        :param identity: User identity.
        :return: Dictionary of available facets.
        """
        classes: list[type] = api_config.search.params_interpreters_cls
        grouped_facets_param_class: type[GroupedFacetsParam] | None = next(
            (cls for cls in classes if issubclass(cls, GroupedFacetsParam)),
            None,
        )
        if not grouped_facets_param_class:
            return cast("dict[str, dsl.Facet]", api_config.search.facets)
        grouped_facets_param_instance: GroupedFacetsParam = grouped_facets_param_class(api_config.search)

        # mypy can not get the type, that's why we use ignore
        return grouped_facets_param_instance.identity_facets(identity)  # type: ignore[no-any-return]

    def search_available_sort_options(
        self,
        api_config: RecordServiceConfig,
        identity: Identity,  # noqa: ARG002 added for inheritance
    ) -> dict[str, dict[str, Any]]:
        """Return available sort options for search.

        :param api_config: API configuration object.
        :param identity: User identity.
        :return: List of available sort options.
        """
        return cast("dict[str, dict[str, Any]]", api_config.search.sort_options)

    def search_active_facets(self, api_config: RecordServiceConfig, identity: Identity) -> list[str]:
        """Return list of active facets that will be displayed by search app.

        By default, all facets are active but a repository can, for performance reasons,
        display only a subset of facets.

        :param api_config: API configuration object.
        :param identity: User identity.
        :return: List of active facet keys.
        """
        return list(self.search_available_facets(api_config, identity).keys())

    def additional_filter_labels(self, filters: dict[str, list[str]]) -> dict[str, LabeledAggregation]:
        """Return human-readable list of filters that are currently applied in the URL.

        Sometimes those are not available in the response from the search API.

        :param filters: Dictionary of filters where keys are filter names and values are lists of selected values.
        :return: Dictionary of translated filter parameters and their labels.
        """
        translated_filters: dict[str, LabeledAggregation] = {}

        service_config = current_runtime.models[self.model_name].service_config
        facets = service_config.search.facets

        for k, filter_values in filters.items():
            facet = facets.get(k)
            if not facet:
                continue

            translated_filters.setdefault(k, {"buckets": []})
            facet_label = getattr(facet, "_label", None)
            if facet_label:
                translated_filters[k]["label"] = facet_label

            value_labels_attr = getattr(facet, "_value_labels", None)
            if not value_labels_attr:
                translated_filters[k]["buckets"] = [{"key": key} for key in filter_values]
                continue

            value_labels: dict[str, str]
            if callable(value_labels_attr):
                value_labels = cast("dict[str, str]", value_labels_attr(filter_values))
            elif isinstance(value_labels_attr, dict):
                value_labels = value_labels_attr
            else:
                value_labels = {}

            translated_filters[k]["buckets"] = [
                {"key": key, "label": value_labels.get(key, key)} for key in filter_values
            ]

        return translated_filters

    def search_active_sort_options(
        self,
        api_config: RecordServiceConfig,
        identity: Identity,  # noqa: ARG002 added for inheritance
    ) -> list[str]:
        """Return list of active sort options for the search app.

        :param api_config: API configuration object.
        :param identity: User identity.
        :return: List of active sort option keys.
        """
        return list(api_config.search.sort_options.keys())

    def search_sort_config(
        self,
        available_options: dict[str, dict[str, Any]],  # contents of SearchOptions.sort_options field
        selected_options: list[str] | None = None,
        default_option: str | None = None,
        no_query_option: str | None = None,
    ) -> SortConfig:
        """Return a SortConfig object for search sorting options.

        :param available_options: List of available sort options.
        :param selected_options: List of selected sort options.
        :param default_option: Default sort option.
        :param no_query_option: Sort option when no query is present.
        :return: SortConfig instance.
        """
        if selected_options is None:
            selected_options = []
        return SortConfig(available_options, selected_options, default_option, no_query_option)

    def search_facets_config(
        self,
        available_facets: dict[str, dsl.Facet],
        selected_facets: list[str] | None = None,
    ) -> FacetsConfig:
        """Return a FacetsConfig object for search facets configuration.

        :param available_facets: Dictionary of available facets.
        :param selected_facets: List of selected facet keys.
        :return: FacetsConfig instance.
        """
        if selected_facets is None:
            selected_facets = []
        facets_config = {}
        for facet_key, facet in available_facets.items():
            facets_config[facet_key] = {
                "facet": facet,
                "ui": {
                    "field": facet._params.get(  # noqa: SLF001  access private attribute
                        "field", facet_key
                    ),
                },
            }

        return FacetsConfig(facets_config, selected_facets)

    def ignored_search_filters(self) -> list[str]:
        """Return a list of search filters to ignore.

        Override this method downstream to specify which filters should be ignored.

        :return: List of filter names to ignore.
        """
        """Return a list of search filters to ignore.

        Override this method downstream to specify which filters should be ignored.
        """
        return ["allversions"]

    def search_endpoint_url(
        self,
        identity: Identity,  # noqa: ARG002 added for inheritance
        overrides: dict[str, str] | None = None,
        **kwargs: Any,  # noqa: ARG002 added for inheritance
    ) -> str:
        """Return the API endpoint URL for search.

        :param identity: User identity.
        :param api_config: API configuration object.
        :param overrides: Dictionary of overrides for endpoint URL.
        :param kwargs: Additional options.
        :return: String URL for search endpoint.
        """
        if overrides is None:
            overrides = {}
        # mypy seems to ignore the type in runtime, thus added ignore
        return self.model.api_url("search")  # type: ignore[no-any-return]

    def search_app_config(
        self,
        identity: Identity,
        api_config: RecordServiceConfig,
        overrides: dict[str, str] | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Return a SearchAppConfig object for the search UI.

        :param identity: User identity.
        :param api_config: API configuration object.
        :param overrides: Dictionary of overrides for app config.
        :param kwargs: Additional options.
        :return: SearchAppConfig instance.
        """
        if overrides is None:
            overrides = {}
        opts = {
            "endpoint": self.search_endpoint_url(identity, overrides=overrides, **kwargs),
            "headers": {"Accept": "application/vnd.inveniordm.v1+json"},
            "grid_view": False,
            "sort": self.search_sort_config(
                available_options=self.search_available_sort_options(api_config, identity),
                selected_options=self.search_active_sort_options(api_config, identity),
                default_option=api_config.search.sort_default,
                no_query_option=api_config.search.sort_default_no_query,
            ),
            "facets": self.search_facets_config(
                available_facets=self.search_available_facets(api_config, identity),
                selected_facets=self.search_active_facets(api_config, identity),
            ),
        }
        opts.update(kwargs)
        return cast("dict[str, Any]", SearchAppConfig.generate(opts, **overrides))

    def custom_fields(self, **kwargs: Any) -> dict[str, Any]:
        """Return UI configuration for custom fields defined in the record class.

        :param kwargs: Additional options for custom field config.
        :return: Dictionary with UI custom field configuration.
        """
        # get the record class
        # TODO: this does not look right, why record and then draft if record is always present?
        record_class = self.model.record_cls or self.model.draft_cls
        ui: list[dict[str, Any]] = []
        ret = {
            "ui": ui,
        }
        if not record_class:
            return ret
        # try to get custom fields from the record
        for _fld_name, fld in sorted(inspect.getmembers(record_class)):
            # look at relations at first
            if not isinstance(fld, MultiRelationsField):
                continue

            relation_subfields = fld._original_fields.values()  # noqa: SLF001
            for relation_rel in relation_subfields:
                if not isinstance(relation_rel, CustomFieldsRelation):
                    continue

                prefix = "custom_fields."

                config_key = relation_rel._fields_var  # noqa
                ui_config = self._get_custom_fields_ui_config(config_key, **kwargs)
                if not ui_config:
                    continue

                for section in ui_config:
                    section_with_fields = {
                        **section,
                        "fields": [
                            {
                                **field,
                                "field": prefix + field["field"],
                            }
                            for field in section.get("fields", [])
                        ],
                    }
                    ui.append(section_with_fields)
        return ret

    def _get_custom_fields_ui_config(
        self,
        key: str,
        **kwargs: Any,  # noqa: ARG002 added for inheritance
    ) -> list[dict[str, Any]]:
        """Get UI configuration for custom fields by key.

        :param key: Custom field config key.
        :param kwargs: Additional options.
        :return: List of UI config sections for the custom field.
        """
        # TODO: should not the key be uppercased here?
        return current_app.config.get(f"{key}_UI", [])  # type: ignore[no-any-return]

    def form_config(
        self,
        identity: Identity | None = None,  # noqa: ARG002 added for inheritance
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Get the react form configuration.

        :param identity: User identity (optional).
        :param kwargs: Additional configuration options.
        :return: Dictionary with form configuration for React forms.
        """
        """Get the react form configuration."""
        return dict(
            overridableIdPrefix=f"{self.application_id.capitalize()}.Form",
            **kwargs,
        )
