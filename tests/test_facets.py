from flask import current_app
from invenio_records_rest.facets import default_facets_factory, terms_filter
from invenio_search import RecordsSearch

from oarepo_ui import translate_facet, translate_filters
from oarepo_ui.facets import (
    RoleFacets,
    TranslatedFacet,
    get_translated_facet,
    nested_facet,
    term_facet,
    translate_facets,
)


def test_term_facet():
    res = term_facet('test')
    assert res == {'terms': {'field': 'test', 'size': 100, 'order': {'_count': 'desc'}}}


def test_term_facet_2():
    res = term_facet('test', missing="missing_field")
    assert res == {
        'terms': {
            'field': 'test', 'size': 100, 'order': {'_count': 'desc'}, 'missing': 'missing_field'
        }
    }


def test_role_facets(app):
    _ = lambda x: x
    FACETS = {
        'category': {
            'terms': {
                'field': 'category',
            },
        }
    }

    FILTERS = {_('category'): terms_filter('category')}

    AUTHENTICATED_FACETS = FACETS
    ANONYMOUS_FACETS = FACETS

    obj = RoleFacets(
        authenticated=dict(
            aggs=translate_facets(AUTHENTICATED_FACETS, label='{facet_key}'),
            filters=translate_filters(FILTERS, label='{filter_key}')
        ),
        curator=dict(
            aggs=translate_facets(FACETS, label='{facet_key}'),
            filters=translate_filters(FILTERS, label='{filter_key}')
        ),
        anonymous=dict(
            aggs=translate_facets(ANONYMOUS_FACETS, label='{facet_key}'),
            filters=translate_filters(FILTERS, label='{filter_key}')
        ),
    )

    aggs = obj.get("aggs")
    filters = obj.get("filters")

    assert aggs is not None
    assert filters is not None


def test_translate_facets(app):
    FACETS = {
        'category': {
            'terms': {
                'field': 'category',
            },
        }
    }

    aggs = translate_facets(FACETS)
    assert aggs == {'category': {'terms': {'field': 'category'}}}


def test_translate_facets_2(app):
    FACETS = {
        'category': {
            'terms': {
                'field': 'category',
            },
        }
    }

    aggs = translate_facets(FACETS)
    assert aggs == {'category': {'terms': {'field': 'category'}}}


def tests_translate_facet():
    _ = lambda x: x
    res = translate_facet(term_facet('archeologic'), possible_values=[
        _('false'),
        _('true')
    ])
    assert isinstance(res, TranslatedFacet)
    assert res.possible_values == ["false", "true"]
    assert res == {'terms': {'field': 'archeologic', 'size': 100, 'order': {'_count': 'desc'}}}


def test_default_facets_factory(app):
    _ = lambda x: x
    FACETS = {
        'category': {
            'terms': {
                'field': 'category',
            },
        }
    }

    FILTERS = {_('category'): terms_filter('category')}

    AUTHENTICATED_FACETS = FACETS
    ANONYMOUS_FACETS = FACETS

    obj = RoleFacets(
        authenticated=dict(
            aggs=translate_facets(AUTHENTICATED_FACETS, label='{facet_key}'),
            filters=translate_filters(FILTERS, label='{filter_key}')
        ),
        curator=dict(
            aggs=translate_facets(FACETS, label='{facet_key}'),
            filters=translate_filters(FILTERS, label='{filter_key}')
        ),
        anonymous=dict(
            aggs=translate_facets(ANONYMOUS_FACETS, label='{facet_key}'),
            filters=translate_filters(FILTERS, label='{filter_key}')
        ),
    )
    current_app.config['RECORDS_REST_FACETS'] = {"func": obj}
    search = RecordsSearch()
    search_, urlkwargs = default_facets_factory(search, "func")
    print(search_, urlkwargs)


def test_get_translated_facet():
    _ = lambda x: x
    facet = {'terms': {'field': 'category'}}
    res = get_translated_facet(facet)
    assert res is None
    facet = TranslatedFacet(facet, None, None, None, None, None)
    res2 = get_translated_facet(facet)
    assert res2 == {'terms': {'field': 'category'}}


def test_nested_facet():
    facet = nested_facet("test", term_facet('test.path.bla'))
    assert facet == {
        'nested': {'path': 'test'}, 'aggs': {
            'inner_facet': {
                'terms': {'field': 'test.path.bla', 'size': 100, 'order': {'_count': 'desc'}}
            }
        }
    }
