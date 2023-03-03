from invenio_db import db
from invenio_records.models import RecordMetadataBase


class MockRecordMetadata(db.Model, RecordMetadataBase):
    """Model for MockRecordRecord metadata."""

    __tablename__ = "mockrecord_metadata"

    # Enables SQLAlchemy-Continuum versioning
    __versioned__ = {}
