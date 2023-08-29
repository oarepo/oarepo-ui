from invenio_records_resources.services import Link


class UIRecordLink(Link):
    """Short cut for writing record links."""

    @staticmethod
    def vars(record, vars):
        """Variables for the URI template."""
        vars.update({"id": record.id})
