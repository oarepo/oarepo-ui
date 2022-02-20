from invenio_records_resources.resources import RecordResourceConfig, SearchRequestArgsSchema
import marshmallow as ma


class CommaSeparatedList(ma.fields.Field):
    def _deserialize(self, value, attr, data, **kwargs):
        return [x.strip() for x in value.split(',') if x.strip()]

    def _serialize(self, value, attr, obj, **kwargs):
        return ','.join(value) if value else ''


class UISearchRequestArgsSchema(SearchRequestArgsSchema):
    source = CommaSeparatedList()


class UIResourceConfig(RecordResourceConfig):
    request_search_args = UISearchRequestArgsSchema
