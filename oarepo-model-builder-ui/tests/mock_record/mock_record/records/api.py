from invenio_pidstore.providers.recordid_v2 import RecordIdProviderV2
from invenio_records.systemfields import ConstantField
from invenio_records_resources.records.api import Record
from invenio_records_resources.records.systemfields import IndexField
from invenio_records_resources.records.systemfields.pid import PIDField, PIDFieldContext
from mock_record.records.dumper import MockRecordDumper
from mock_record.records.models import MockRecordMetadata


class MockRecordRecord(Record):
    model_cls = MockRecordMetadata

    schema = ConstantField("$schema", "http://localhost/schemas/mock_record-1.0.0.json")

    index = IndexField("mock_record-mock_record-1.0.0")

    pid = PIDField(
        create=True, provider=RecordIdProviderV2, context_cls=PIDFieldContext
    )

    dumper_extensions = []
    dumper = MockRecordDumper(extensions=dumper_extensions)
