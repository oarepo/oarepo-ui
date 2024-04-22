from marshmallow import Schema, fields
from marshmallow.schema import SchemaMeta
from marshmallow_utils.fields import NestedAttribute


def dump_empty(schema_or_field):
    """Return a full json-compatible dict of schema representation with empty values."""
    if isinstance(schema_or_field, (Schema,)):
        schema = schema_or_field
        return {k: dump_empty(v) for (k, v) in schema.fields.items()}
    if isinstance(schema_or_field, SchemaMeta):
        # Nested fields can pass a Schema class (SchemaMeta)
        # or a Schema instance.
        # Schema classes need to be instantiated to get .fields
        schema = schema_or_field()
        return {k: dump_empty(v) for (k, v) in schema.fields.items()}
    if isinstance(schema_or_field, fields.List):
        # return [dump_empty(schema_or_field.inner)]
        return []
    if isinstance(schema_or_field, (NestedAttribute, fields.Nested)):
        field = schema_or_field
        nested_schema = field.nested
        if callable(nested_schema):
            nested_schema = nested_schema()
        return dump_empty(nested_schema)
    if isinstance(schema_or_field, fields.Str):
        return ""
    if isinstance(schema_or_field, fields.Dict):
        return {}
    return None
