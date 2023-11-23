import marshmallow as ma
from invenio_records_resources.services.records.schema import (
    BaseRecordSchema as InvenioBaseRecordSchema,
)

from oarepo_ui.utils import dump_empty


class ModelSchemaWithNoMetadata(InvenioBaseRecordSchema):
    title = ma.fields.String()

    class Meta:
        unknown = ma.INCLUDE


class NestedSchema(ma.Schema):
    title = ma.fields.String()
    count = ma.fields.Integer()
    valid = ma.fields.Boolean()

    class Meta:
        unknown = ma.INCLUDE


class SimpleMetadataSchema(ma.Schema):
    title = ma.fields.String()
    simple_arr = ma.fields.List(ma.fields.String())
    object_arr = ma.fields.List(ma.fields.Nested(NestedSchema))
    nested_obj = ma.fields.Nested(NestedSchema)

    class Meta:
        unknown = ma.INCLUDE


class ModelSchemaWithSimpleMetadata(InvenioBaseRecordSchema):
    metadata = ma.fields.Nested(SimpleMetadataSchema)

    class Meta:
        unknown = ma.INCLUDE


def test_empty_dump_no_metadata():
    assert dump_empty(ModelSchemaWithNoMetadata) == {
        "created": None,
        "id": "",
        "links": None,
        "revision_id": None,
        "title": "",
        "updated": None,
    }


def test_empty_dump():
    assert dump_empty(ModelSchemaWithSimpleMetadata) == {
        "created": None,
        "id": "",
        "links": None,
        "metadata": {
            "nested_obj": {"count": None, "title": "", "valid": None},
            "object_arr": [],
            "simple_arr": [],
            "title": "",
        },
        "revision_id": None,
        "updated": None,
    }
