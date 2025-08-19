#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

import marshmallow as ma
from invenio_records_resources.services.records.schema import (
    BaseRecordSchema as InvenioBaseRecordSchema,
)

from oarepo_ui.utils import dump_empty


class ModelSchemaWithNoMetadata(InvenioBaseRecordSchema):
    """Schema for a model without metadata."""

    title = ma.fields.String()

    class Meta:
        """Schema metadata."""

        unknown = ma.INCLUDE


class NestedSchema(ma.Schema):
    """Schema for a nested object."""

    title = ma.fields.String()
    count = ma.fields.Integer()
    valid = ma.fields.Boolean()

    class Meta:
        """Schema metadata."""

        unknown = ma.INCLUDE


class SimpleMetadataSchema(ma.Schema):
    """Schema for simple metadata with nested fields."""

    title = ma.fields.String()
    simple_arr = ma.fields.List(ma.fields.String())
    object_arr = ma.fields.List(ma.fields.Nested(NestedSchema))
    nested_obj = ma.fields.Nested(NestedSchema)
    nested_via_func = ma.fields.Nested(lambda: NestedSchema())

    class Meta:
        """Schema metadata."""

        unknown = ma.INCLUDE


class ModelSchemaWithSimpleMetadata(InvenioBaseRecordSchema):
    """Schema for a model with simple metadata."""

    metadata = ma.fields.Nested(SimpleMetadataSchema)

    class Meta:
        """Schema metadata."""

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
            "nested_via_func": {"count": None, "title": "", "valid": None},
            "object_arr": [],
            "simple_arr": [],
            "title": "",
        },
        "revision_id": None,
        "updated": None,
    }
