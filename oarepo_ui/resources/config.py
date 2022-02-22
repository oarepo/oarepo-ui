import marshmallow as ma
from flask_resources.parsers import MultiDictSchema
from invenio_records_resources.resources import RecordResourceConfig, SearchRequestArgsSchema

from oarepo_ui.proxy import current_oarepo_ui
from flask import g

from marshmallow.validate import Length


class CommaSeparatedList(ma.fields.Field):
    def _deserialize(self, value, attr, data, **kwargs):
        return [x.strip() for x in value.split(',') if x.strip()]

    def _serialize(self, value, attr, obj, **kwargs):
        return ','.join(value) if value else ''


class OARepoContextCheckMixin:
    @ma.post_load()
    def check_oarepo_context(self, data, **kwargs):
        if data.get('oarepo_context'):
            current_oarepo_ui.check_oarepo_context(data.get('oarepo_context', 'default'), g.identity)
        return data


class ListSingleString(ma.fields.String):
    default_error_messages = {
        **ma.fields.String.default_error_messages,
        "not_one": "Only one value expected."
    }

    def _deserialize(self, value, attr, data, **kwargs):
        if not value:
            return None
        if len(value) != 1:
            raise self.make_error("not_one")
        return super()._deserialize(value[0], attr, data, **kwargs)


class OARepoSearchRequestArgsSchema(OARepoContextCheckMixin, SearchRequestArgsSchema):
    source = CommaSeparatedList()
    oarepo_context = ListSingleString(data_key='oarepo:context')


class OARepoReadRequestArgsSchema(OARepoContextCheckMixin, MultiDictSchema):
    oarepo_context = ListSingleString(data_key='oarepo:context')


class OARepoResourceConfig(RecordResourceConfig):
    request_search_args = OARepoSearchRequestArgsSchema
    request_read_args = OARepoReadRequestArgsSchema
