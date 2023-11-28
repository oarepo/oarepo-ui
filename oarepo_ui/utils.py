from marshmallow import Schema, fields
from marshmallow.schema import SchemaMeta
from marshmallow_utils.fields import NestedAttribute

num2words = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
    11: "eleven",
    12: "twelve",
    13: "thirteen",
    14: "fourteen",
    15: "fifteen",
    16: "sixteen",
    17: "seventeen",
    18: "eighteen",
    19: "nineteen",
    20: "twenty",
    30: "thirty",
    40: "forty",
    50: "fifty",
    60: "sixty",
    70: "seventy",
    80: "eighty",
    90: "ninety",
    0: "zero",
}


def n2w(n):
    try:
        return num2words[n]
    except KeyError:
        try:
            return num2words[n - n % 10] + num2words[n % 10].lower()
        except KeyError:
            raise AttributeError("Number out of range")


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

    return None
