from invenio_records_resources.services import SearchOptions
from invenio_records_resources.services.records.params import QueryStrParam, PaginationParam, SortParam

from oarepo_ui.services.facets import SelectableFacetsParam
from oarepo_ui.services.source import SourceParam


class UISearchOptions(SearchOptions):
    params_interpreters_cls = [
        QueryStrParam,
        PaginationParam,
        SortParam,
        SourceParam,
        SelectableFacetsParam
    ]
