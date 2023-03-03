from invenio_records_resources.services import SearchOptions as InvenioSearchOptions

from . import facets


def _(x):
    """Identity function for string extraction."""
    return x


class MockRecordSearchOptions(InvenioSearchOptions):
    """MockRecordRecord search options."""

    facets = {
        "prices": facets.prices,
        "expires": facets.expires,
        "lowest_price": facets.lowest_price,
        "tags": facets.tags,
        "providers_org_id": facets.providers_org_id,
        "providers_name": facets.providers_name,
        "providers_area": facets.providers_area,
        "providers_tags": facets.providers_tags,
    }
    sort_options = {
        **InvenioSearchOptions.sort_options,
    }
