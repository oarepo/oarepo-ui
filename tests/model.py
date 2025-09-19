#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

from typing import TYPE_CHECKING, override

import importlib_metadata
import marshmallow as ma
from flask_resources import BaseListSchema, BaseObjectSchema, MarshmallowSerializer
from flask_resources.serializers import JSONSerializer
from invenio_i18n import lazy_gettext as _
from invenio_pidstore.providers.recordid_v2 import RecordIdProviderV2
from invenio_rdm_records.resources.serializers.ui.schema import (
    FormatDate,
)
from invenio_records.models import RecordMetadata
from invenio_records.systemfields import DictField
from invenio_records.systemfields.relations import MultiRelationsField
from invenio_records_permissions import RecordPermissionPolicy
from invenio_records_permissions.generators import (
    AnyUser,
    AuthenticatedUser,
    SystemProcess,
)
from invenio_records_resources.records.api import Record
from invenio_records_resources.records.systemfields import IndexField, PIDField
from invenio_records_resources.records.systemfields.pid import PIDFieldContext
from invenio_records_resources.resources import RecordResource, RecordResourceConfig
from invenio_records_resources.services import (
    RecordLink,
    RecordService,
    RecordServiceConfig,
)
from invenio_records_resources.services.base.config import ConfiguratorMixin
from invenio_vocabularies.records.systemfields.relations import CustomFieldsRelation
from oarepo_runtime.api import Export
from oarepo_runtime.resources import exports_to_response_handlers

from oarepo_ui.resources import (
    BabelComponent,
    PermissionsComponent,
    RecordsUIResource,
    RecordsUIResourceConfig,
)
from oarepo_ui.resources.components.bleach import AllowedHtmlTagsComponent
from oarepo_ui.resources.components.custom_fields import CustomFieldsComponent

if TYPE_CHECKING:
    from collections.abc import Mapping

    from invenio_records_resources.services.records.results import RecordItem


class ModelRecordIdProvider(RecordIdProviderV2):
    """Record ID provider for ModelRecord."""

    pid_type = "rec"


class ModelRecord(Record):
    """ModelRecord class for testing purposes."""

    index = IndexField("test_record")
    model_cls = RecordMetadata
    pid = PIDField(provider=ModelRecordIdProvider, context_cls=PIDFieldContext, create=True)
    custom_fields = DictField(clear_none=True, create_if_missing=True)
    relations = MultiRelationsField(custom_fields=CustomFieldsRelation("NESTED_CF"))


class ModelPermissionPolicy(RecordPermissionPolicy):
    """Permission policy for ModelRecord."""

    can_create = (AuthenticatedUser(), SystemProcess())
    can_search = (AnyUser(), SystemProcess())
    can_read = (AnyUser(), SystemProcess())
    can_update = (AuthenticatedUser(), SystemProcess())

    # the default has changed between RDM 11 and RDM 12, making it explicit
    can_read_deleted_files = (AuthenticatedUser(), SystemProcess())


class ModelSchema(ma.Schema):
    """Schema for ModelRecord."""

    title = ma.fields.String()
    created = ma.fields.DateTime()
    updated = ma.fields.DateTime()

    class Meta:
        """Schema metadata."""

        unknown = ma.INCLUDE


class ModelServiceConfig(RecordServiceConfig):
    """Configuration for ModelService."""

    record_cls = ModelRecord
    permission_policy_cls = ModelPermissionPolicy
    schema = ModelSchema

    service_id = "simple_model"
    url_prefix = "/simple-model"

    @property
    def links_item(self):
        """Get the links for a single item."""
        return {
            "self": RecordLink("{+api}%s/{id}" % self.url_prefix),  # noqa
            "ui": RecordLink("{+ui}%s/{id}" % self.url_prefix),  # noqa
        }


class ModelService(RecordService):
    """Service for ModelRecord."""


class InvenioRecordUISchema(BaseObjectSchema):
    """UI schema for Invenio records.

    This schema should be RDM compatible on the top-level fields.
    """

    created_date_l10n_short = FormatDate(attribute="created", format="short")
    created_date_l10n_medium = FormatDate(attribute="created", format="medium")
    created_date_l10n_long = FormatDate(attribute="created", format="long")
    created_date_l10n_full = FormatDate(attribute="created", format="full")

    updated_date_l10n_short = FormatDate(attribute="updated", format="short")
    updated_date_l10n_medium = FormatDate(attribute="updated", format="medium")
    updated_date_l10n_long = FormatDate(attribute="updated", format="long")
    updated_date_l10n_full = FormatDate(attribute="updated", format="full")


class ModelUISchema(InvenioRecordUISchema):
    """Schema for ModelRecord."""

    class Meta:
        """Schema metadata."""

        unknown = ma.INCLUDE


class ModelUISerializer(MarshmallowSerializer):
    """UI JSON serializer."""

    def __init__(self):
        """Initialise Serializer."""
        super().__init__(
            format_serializer_cls=JSONSerializer,
            object_schema_cls=ModelUISchema,
            list_schema_cls=BaseListSchema,
            schema_context={"object_key": "ui"},
        )


exports = [
    Export(
        code="json",
        name=_("Native JSON"),
        mimetype="application/json",
        serializer=JSONSerializer(),
    ),
    Export(
        code="ui_json",
        name=_("Native UI JSON"),
        mimetype="application/vnd.inveniordm.v1+json",
        serializer=ModelUISerializer(),
    ),
]


class ModelResourceConfig(RecordResourceConfig, ConfiguratorMixin):
    """SimpleModelRecord resource config."""

    blueprint_name = "simple_model_api"
    url_prefix = "/api/simple-model"

    @property
    def response_handlers(self):
        """Get the response handlers for the resource."""
        entrypoint_response_handlers = {}
        for x in importlib_metadata.entry_points(group="invenio.simple_model.response_handlers"):
            entrypoint_response_handlers.update(x.load())
        return {
            **exports_to_response_handlers(exports),
            **entrypoint_response_handlers,
        }


class ModelResource(RecordResource):
    """SimpleModelRecord resource."""

    # here you can for example redefine
    # create_url_rules function to add your own rules


class ModelUIResourceConfig(RecordsUIResourceConfig):
    """Configuration for ModelUIResource."""

    model_name = "simple-model"

    blueprint_name = "simple_model"
    url_prefix = "/simple-model"
    ui_serializer_class = ModelUISerializer
    templates: Mapping[str, str | None] = {
        **RecordsUIResourceConfig.templates,
        "detail": "TestDetail",
        "search": "TestSearch",
        "create": "test.TestCreate",
        "edit": "TestEdit",
    }

    components = (
        BabelComponent,
        PermissionsComponent,
        AllowedHtmlTagsComponent,
        CustomFieldsComponent,
    )


class ModelUIResource(RecordsUIResource):
    """SimpleModelRecord UI resource."""

    @override
    def _get_record(
        self, pid_value: str, allow_draft: bool = False, include_deleted: bool = False
    ) -> RecordItem | None:
        # we are not testing drafts here, so always return published record
        # tests for drafts should be in oarepo-model-builder-drafts
        return super()._get_record(pid_value, allow_draft=False, include_deleted=False)
