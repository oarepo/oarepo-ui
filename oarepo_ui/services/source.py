from invenio_records_resources.services.records.params.base import ParamInterpreter


class SourceParam(ParamInterpreter):
    def apply(self, identity, search, params):
        if params.get('source'):
            source = [
                         'uuid', 'version_id', 'created', 'updated', 'pid', 'id'
                     ] + params['source']
            return search.source(source)
        return search
