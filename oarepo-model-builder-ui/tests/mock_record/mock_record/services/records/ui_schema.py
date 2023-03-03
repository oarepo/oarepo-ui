import marshmallow as ma
from flask_resources import BaseObjectSchema
from invenio_records_resources.services.records.schema import (
    BaseRecordSchema as InvenioBaseRecordSchema,
)
from marshmallow import ValidationError
from marshmallow import fields as ma_fields
from marshmallow import validate as ma_validate
from marshmallow_utils import fields as mu_fields
from marshmallow_utils import schemas as mu_schemas
from oarepo_runtime.ui import marshmallow as l10n
from oarepo_runtime.validation import validate_date


class ProvidersItemUISchema(ma.Schema):
    """ProvidersItemUISchema schema."""

    org_id = ma_fields.String()
    name = ma_fields.String()
    area = ma_fields.String()
    tags = ma_fields.List(ma_fields.String())


class MockRecordUISchema(BaseObjectSchema):
    """MockRecordUISchema schema."""

    title = ma_fields.String()
    prices = ma_fields.List(ma_fields.Float())
    expires = l10n.LocalizedDate()
    lowest_price = ma_fields.Float()
    tags = ma_fields.List(ma_fields.String())
    providers = ma_fields.List(ma_fields.Nested(lambda: ProvidersItemUISchema()))
