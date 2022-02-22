from invenio_records_resources.services import RecordServiceConfig
from invenio_records_resources.services.records.components import MetadataComponent

from oarepo_ui.services.source import SourceComponent


class UIRecordServiceConfig(RecordServiceConfig):
    # Service components
    components = [
        MetadataComponent,
        SourceComponent
    ]
