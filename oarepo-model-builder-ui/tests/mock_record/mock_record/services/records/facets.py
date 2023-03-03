"""Facet definitions."""

from invenio_records_resources.services.records.facets import TermsFacet
from invenio_search.engine import dsl
from oarepo_runtime.facets.nested_facet import NestedLabeledFacet

prices = TermsFacet(field="prices")


expires = TermsFacet(field="expires")


lowest_price = TermsFacet(field="lowest_price")


tags = TermsFacet(field="tags")


providers_org_id = NestedLabeledFacet(
    path="providers", nested_facet=TermsFacet(field="providers.org_id")
)


providers_name = NestedLabeledFacet(
    path="providers", nested_facet=TermsFacet(field="providers.name")
)


providers_area = NestedLabeledFacet(
    path="providers", nested_facet=TermsFacet(field="providers.area")
)


providers_tags = NestedLabeledFacet(
    path="providers", nested_facet=TermsFacet(field="providers.tags")
)
