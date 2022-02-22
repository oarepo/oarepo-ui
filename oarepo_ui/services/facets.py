from invenio_records_resources.services.records.facets import FacetsResponse
from invenio_records_resources.services.records.params.facets import FacetsParam

from oarepo_ui.services.mixins import ContextMixin


class SelectableFacetsResponse(FacetsResponse):
    def _iter_facets(self):
        for name, facet in self._facets_param.facets.items():
            if hasattr(self.aggregations, name):
                yield name, facet, getattr(self.aggregations, name), \
                      self._facets_param.selected_values.get(name, [])


class SelectableFacetsParam(ContextMixin, FacetsParam):

    def aggregate(self, search, selected_facets, params):
        context_facets = self.get_context(params, 'listing', 'facets') or self.facets.keys()
        if selected_facets:
            context_facets = set(context_facets) & set(selected_facets)

        for names in context_facets:
            names = [x.strip() for x in names.split(',')]
            for name in names:
                if name not in self.facets:
                    continue
                agg = self.facets[name].get_aggregation()
                search.aggs.bucket(name, agg)
        return search

    # need to copy this from the base class as params are not propagated to aggregate & filter methods
    def apply(self, identity, search, params):
        """Evaluate the facets on the search."""
        # Add filters
        facets_values = params.pop("facets", {})
        aggs = facets_values.pop('aggs', None)
        for name, values in facets_values.items():
            if name in self.facets:
                self.add_filter(name, values)

        # Customize response class to add a ".facets" property.
        search = search.response_class(
            SelectableFacetsResponse.create_response_cls(self))

        # Build search
        search = self.aggregate(search, aggs, params)
        search = self.filter(search)

        # Update params
        params.update(self.selected_values)

        return search

    # AND functionality, not OR
    def filter(self, search):
        """Apply a post filter on the search."""
        if not self._filters:
            return search

        filters = list(self._filters.values())

        post_filter = filters[0]
        for f in filters[1:]:
            post_filter &= f

        return search.filter(post_filter)
