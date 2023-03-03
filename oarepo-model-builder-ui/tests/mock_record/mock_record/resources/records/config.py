import importlib_metadata
from flask_resources import ResponseHandler
from invenio_records_resources.resources import RecordResourceConfig
from mock_record.resources.records.ui import MockRecordUIJSONSerializer


class MockRecordResourceConfig(RecordResourceConfig):
    """MockRecordRecord resource config."""

    blueprint_name = "MockRecord"
    url_prefix = "/mock-record/"

    @property
    def response_handlers(self):
        entrypoint_response_handlers = {}
        for x in importlib_metadata.entry_points(
            group="invenio.mock_record.response_handlers"
        ):
            entrypoint_response_handlers.update(x.load())
        return {
            "application/vnd.inveniordm.v1+json": ResponseHandler(
                MockRecordUIJSONSerializer()
            ),
            **super().response_handlers,
            **entrypoint_response_handlers,
        }
