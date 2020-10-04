from flask import request
from invenio_records_rest.facets import terms_filter

from oarepo_ui import (
    keep_facet,
    keep_facets,
    keep_filter,
    keep_filters,
    translate_facet,
    translate_facets,
    translate_filter,
    translate_filters,
)

FACETS = {
    'category': {
        'terms': {
            'field': 'category',
        },
    }
}
FILTERS = {
    'category': terms_filter('category')
}


def permission_factory(index_name, **kwargs):
    check_perms = request.args.get('perms', False)
    class Inner:
        def can(self):
            return not check_perms or index_name.startswith('translate-')

    return Inner()


RECORDS_REST_FACETS = {
    'translate-facets-filters': {
        'aggs': translate_facets(FACETS,
                                 label='my.own.facet.{facet_key}',
                                 value='my.own.facet.{facet_key}.{value_key}',
                                 permissions=permission_factory),
        'filters': translate_filters(FILTERS, label='my.own.filter.{filter_key}')
    },
    'translate-facets-filters-translator': {
        'aggs': translate_facets(FACETS,
                                 label='my.own.facet.{facet_key}',
                                 value='my.own.facet.{facet_key}.{value_key}',
                                 translator=lambda key, **kwargs: f'test-{key}',
                                 permissions=permission_factory),
        'filters': translate_filters(FILTERS, label='my.own.filter.{filter_key}',
                                     translator=lambda key, **kwargs: f'test-{key}')
    },
    'default-facets': {
        'aggs': {
            'category': {
                'terms': {
                    'field': 'category',
                },
            }
        }
    },
    'no-translation-facets': {
        'aggs': keep_facets({
            'category': {
                'terms': {
                    'field': 'category',
                },
            }
        },
            permissions=permission_factory)
    },
    'no-translation-facet': {
        'aggs': {
            'category': keep_facet({
                'terms': {
                    'field': 'category',
                },
            },
                permissions=permission_factory)
        }
    },
    'translate-facet': {
        'aggs': {
            'category': translate_facet({
                'terms': {
                    'field': 'category',
                },
            }, label='my.own.facet.label',
                permissions=permission_factory)
        }
    },
    'default-filters': {
        'filters': {
            'category': terms_filter('category')
        }
    },
    'no-translation-filters': {
        'filters': keep_filters({
            'category': terms_filter('category')
        })
    },
    'no-translation-filter': {
        'filters': {
            'category': keep_filter(terms_filter('category'))
        }
    },
    'translate-filter': {
        'filters': {
            'category': translate_filter(terms_filter('category'), label='my.own.filter.label')
        }
    }
}
