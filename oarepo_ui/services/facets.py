from invenio_records_resources.services.records.facets import FacetsResponse
from invenio_records_resources.services.records.params.facets import FacetsParam


class SelectableFacetsResponse(FacetsResponse):
    def _iter_facets(self):
        for name, facet in self._facets_param.facets.items():
            if hasattr(self.aggregations, name):
                yield name, facet, getattr(self.aggregations, name), \
                      self._facets_param.selected_values.get(name, [])


class SelectableFacetsParam(FacetsParam):

    def aggregate(self, search, selected_facets):
        if selected_facets is None:
            return super().aggregate(search)

        for names in (selected_facets or self.facets.keys()):
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
        search = self.aggregate(search, aggs)
        search = self.filter(search)

        # Update params
        params.update(self.selected_values)

        return search
