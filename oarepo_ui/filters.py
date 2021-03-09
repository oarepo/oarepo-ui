from elasticsearch_dsl import Q
from elasticsearch_dsl.query import Bool
from invenio_records_rest.facets import range_filter

from oarepo_ui.constants import no_translation
from oarepo_ui.utils import get_oarepo_attr, partial_format


# COMMON FILTERS
def boolean_filter(field):
    def val2bool(x):
        if x == '1' or x == 'true' or x is True:
            return True
        return False

    def inner(values):
        return Q('terms', **{field: [val2bool(x) for x in values]})

    return inner


def date_year_range(field, start_date_math=None, end_date_math=None, **kwargs):
    def inner(values):
        range_values = [f'{v}-01--{v}-12' for v in values]
        return range_filter(field, start_date_math, end_date_math, **kwargs)(range_values)

    return inner

# TODO: If necessary, uncomment it. Don't know if it is general enough.
# def state_terms_filter(field):
#     def inner(values):
#         if 'filling' in values:
#             return Bool(should=[
#                 Q('terms', **{field: values}),
#                 Bool(
#                     must_not=[
#                         Q('exists', field='state')
#                     ]
#                 )
#             ], minimum_should_match=1)
#         else:
#             return Q('terms', **{field: values})
#
#     return inner


def exclude_filter(f):
    def inner(values):
        q = f(values)
        return ~q

    return inner


# TRANSLATED FILTERS
class TranslatedFilter:
    def __init__(self, label, translator, type=None):
        self.label = label
        self.translator = translator
        self.type = type


def translate_filters(filters, label=None, translator=None):
    for filter_key, filter_val in list(filters.items()):
        oarepo = get_oarepo_attr(filter_val)
        if 'translation' not in get_oarepo_attr(filter_val):
            oarepo['translation'] = TranslatedFilter(
                partial_format(label,
                               filter_key=filter_key) if label and label is not no_translation
                else label,
                translator)
    return filters


def translate_filter(filter, label=None, translator=None, type=None):
    if not hasattr(filter, '_oarepo_ui'):
        setattr(filter, '_oarepo_ui', {})
    getattr(filter, '_oarepo_ui')['translation'] = TranslatedFilter(
        label, translator, type=type)
    return filter


def keep_filters(filters, **kwargs):
    return translate_filters(filters, label=no_translation, **kwargs)


def keep_filter(filter, **kwargs):
    return translate_filter(filter, label=no_translation, **kwargs)
