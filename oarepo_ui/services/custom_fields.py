from invenio_records_resources.services.custom_fields import BaseListCF
from marshmallow import fields


class ComplexCF(BaseListCF):

    def __init__(self, name, nestedCFs, multiple=False, **kwargs):
        nested_fields = {cf.name: cf.field for cf in nestedCFs}

        super().__init__(
            name,
            field_cls=fields.Nested,
            field_args=dict(
                nested=nested_fields
            ),
            multiple=multiple,
            **kwargs
        )
        self.nestedCFs = nestedCFs

    @property
    def mapping(self):
        return {cf.name: cf.mapping for cf in self.nestedCFs}

