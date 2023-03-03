from invenio_records_resources.services import RecordLink
from invenio_records_resources.services import RecordServiceConfig
from invenio_records_resources.services import (
    RecordServiceConfig as InvenioRecordServiceConfig,
)
from invenio_records_resources.services import pagination_links
from mock_record.records.api import MockRecordRecord
from mock_record.services.records.permissions import MockRecordPermissionPolicy
from mock_record.services.records.schema import MockRecordSchema
from mock_record.services.records.search import MockRecordSearchOptions


class MockRecordServiceConfig(RecordServiceConfig):
    """MockRecordRecord service config."""

    url_prefix = "/mock-record/"

    permission_policy_cls = MockRecordPermissionPolicy

    schema = MockRecordSchema

    search = MockRecordSearchOptions

    record_cls = MockRecordRecord
    # todo should i leave this here?
    service_id = "mock_record"

    components = [*RecordServiceConfig.components]

    model = "mock_record"

    @property
    def links_item(self):
        return {
            "self": RecordLink("{self.url_prefix}{id}"),
        }

    @property
    def links_search(self):
        return pagination_links("{self.url_prefix}{?args*}")
