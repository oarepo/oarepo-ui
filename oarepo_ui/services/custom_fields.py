from invenio_records_resources.services.custom_fields import BaseListCF
from marshmallow import fields


class ComplexCF(BaseListCF):

    def __init__(self, name, nested_custom_fields, multiple=False, **kwargs):
        nested_fields = {cf.name: cf.field for cf in nested_custom_fields}

        super().__init__(
            name,
            field_cls=fields.Nested,
            field_args=dict(nested=nested_fields),
            multiple=multiple,
            **kwargs,
        )
        self.nested_custom_fields = nested_custom_fields

    @property
    def mapping(self):
        return {
            "type": "object",
            "properties": {cf.name: cf.mapping for cf in self.nested_custom_fields},
        }
