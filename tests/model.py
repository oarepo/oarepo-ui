import marshmallow as ma
from flask_resources import BaseListSchema, MarshmallowSerializer
from flask_resources.serializers import JSONSerializer
from invenio_pidstore.providers.recordid_v2 import RecordIdProviderV2
from invenio_records.models import RecordMetadata
from invenio_records_permissions import RecordPermissionPolicy
from invenio_records_permissions.generators import (
    AnyUser,
    AuthenticatedUser,
    SystemProcess,
)
from invenio_records_resources.records.api import Record
from invenio_records_resources.records.systemfields import IndexField, PIDField
from invenio_records_resources.records.systemfields.pid import PIDFieldContext
from invenio_records_resources.services import (
    RecordLink,
    RecordService,
    RecordServiceConfig,
)
from oarepo_runtime.services.custom_fields import CustomFields, InlinedCustomFields

from oarepo_ui.resources import (
    BabelComponent,
    PermissionsComponent,
    RecordsUIResource,
    RecordsUIResourceConfig,
)
from oarepo_ui.resources.components.bleach import AllowedHtmlTagsComponent
from oarepo_ui.resources.config import TemplatePageUIResourceConfig
from oarepo_ui.resources.resource import TemplatePageUIResource


class ModelRecordIdProvider(RecordIdProviderV2):
    pid_type = "rec"


class ModelRecord(Record):
    index = IndexField("test_record")
    model_cls = RecordMetadata
    pid = PIDField(
        provider=ModelRecordIdProvider, context_cls=PIDFieldContext, create=True
    )
    nested_cf = CustomFields(config_key="NESTED_CF")
    inline_cf = InlinedCustomFields(config_key="INLINE_CF")


class ModelPermissionPolicy(RecordPermissionPolicy):
    can_create = [AuthenticatedUser(), SystemProcess()]
    can_search = [AnyUser(), SystemProcess()]
    can_read = [AnyUser(), SystemProcess()]
    can_update = [AuthenticatedUser(), SystemProcess()]

    # the default has changed between RDM 11 and RDM 12, making it explicit
    can_read_deleted_files = [AuthenticatedUser(), SystemProcess()]


class ModelSchema(ma.Schema):
    title = ma.fields.String()

    class Meta:
        unknown = ma.INCLUDE


class ModelServiceConfig(RecordServiceConfig):
    record_cls = ModelRecord
    permission_policy_cls = ModelPermissionPolicy
    schema = ModelSchema

    url_prefix = "/simple-model"

    @property
    def links_item(self):
        return {
            "self": RecordLink("{+api}%s/{id}" % self.url_prefix),
            "ui": RecordLink("{+ui}%s/{id}" % self.url_prefix),
        }


class ModelService(RecordService):
    pass


class ModelUISerializer(MarshmallowSerializer):
    """UI JSON serializer."""

    def __init__(self):
        """Initialise Serializer."""
        super().__init__(
            format_serializer_cls=JSONSerializer,
            object_schema_cls=ModelSchema,
            list_schema_cls=BaseListSchema,
            schema_context={"object_key": "ui"},
        )


class ModelUIResourceConfig(RecordsUIResourceConfig):
    api_service = "simple_model"  # must be something included in oarepo, as oarepo is used in tests

    blueprint_name = "simple_model"
    url_prefix = "/simple-model"
    ui_serializer_class = ModelUISerializer
    templates = {
        **RecordsUIResourceConfig.templates,
        "detail": "TestDetail",
        "search": "TestSearch",
        "create": "test.TestCreate",
        "edit": "TestEdit",
    }

    components = [BabelComponent, PermissionsComponent, AllowedHtmlTagsComponent]


class ModelUIResource(RecordsUIResource):
    def _get_record(self, resource_requestctx, allow_draft=False):
        # we are not testing drafts here, so always return published record
        # tests for drafts should be in oarepo-model-builder-drafts
        return super()._get_record(resource_requestctx, allow_draft=False)


class TitlePageUIResourceConfig(TemplatePageUIResourceConfig):
    blueprint_name = "titlepage"
    url_prefix = "/"
    pages = {"": "TitlePage"}


class TitlePageUIResource(TemplatePageUIResource):
    pass
