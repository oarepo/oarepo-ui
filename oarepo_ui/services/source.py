from oarepo_ui.proxy import current_oarepo_ui
from .mixins import ContextMixin


class SourceComponent(ContextMixin):
    def __init__(self, service):
        self.service = service
        self.config = service.config

    def search(self, identity, search, params):
        listing_fields = self.get_context(params, 'listing', 'fields')
        if not listing_fields:
            return search
        return search.source([
                                 'uuid', 'version_id', 'created', 'updated', 'pid', 'id'
                             ] + listing_fields)
