from flask_login import current_user

from oarepo_ui.constants import no_translation
from oarepo_ui.utils import get_oarepo_attr, partial_format


# COMMON FACETS
def nested_facet(path, inner_facet):
    if callable(inner_facet):
        def inner():
            return {
                "nested": {
                    "path": path
                },
                "aggs": {
                    "inner_facet": inner_facet()
                }
            }

        return inner
    else:
        return {
          "nested": {
            "path": path
          },
          "aggs": {
            "inner_facet": inner_facet
          }
        }

def term_facet(field: str, order: str = 'desc', size: int = 100, missing: str = None) -> dict:
    ret: dict = {
        'terms': {
            'field': field,
            'size': size,
            "order": {"_count": order}
        },
    }
    if missing is not None:
        ret['terms']['missing'] = missing
    return ret


def date_histogram_facet(field: str, calendar_interval: str = "year", format: str = "yyyy") -> dict:
    """
    ES Date histogram aggregation

    :param field: address of field in the source
    :param calendar_interval:
    :param format:
    :return:
    :rtype:
    """
    ret: dict = {
        "date_histogram": {
            "field": field,
            "calendar_interval": calendar_interval,
            "format": format
        }
    }
    return ret


# ROLE FACETS
class RoleFacets(dict):
    def __init__(self, **kwargs):
        self.data = kwargs

    def current_role(self):
        if current_user.is_anonymous:
            return 'anonymous'  # pragma: no cover
        return 'authenticated'

    def get(self, key, default=None):
        return self.data.get(self.current_role(), {}).get(key, default)


# TRANSLATED FACETS
class TranslatedFacet(dict):
    def __init__(self, facet_val, label, value, translator, permissions, possible_values):
        assert isinstance(facet_val, dict)
        super().__init__(facet_val)
        self.label = label
        self.value = value
        self.translator = translator
        self.permissions = permissions
        self.possible_values = possible_values


def make_translated_facet(facet_val, label, value, translator, permissions, possible_values=None):
    if callable(facet_val):
        oarepo = get_oarepo_attr(facet_val)
        oarepo['translation'] = TranslatedFacet({}, label, value, translator, permissions,
                                                possible_values)
        return facet_val
    else:
        return TranslatedFacet(facet_val, label, value, translator, permissions, possible_values)


def is_translated_facet(facet_val):
    if callable(facet_val):
        oarepo = get_oarepo_attr(facet_val)
        translation = oarepo.get('translation', None)
        return translation is not None and isinstance(translation, TranslatedFacet)
    else:
        return isinstance(facet_val, TranslatedFacet)


def get_translated_facet(facet):
    if isinstance(facet, TranslatedFacet):
        return facet
    elif callable(facet):
        return get_oarepo_attr(facet).get('translation', None)
    return None


def translate_facets(facets, label=None, value=None, translator=None, permissions=None,
                     possible_values=None):
    facets = {**facets}
    possible_values = possible_values or {}
    for facet_key, facet_val in list(facets.items()):
        facets[facet_key] = translate_facet(
            facet_val,
            label=partial_format(label,
                                 facet_key=facet_key) if label and label is not no_translation
            else label,
            value=partial_format(value,
                                 facet_key=facet_key) if value is not no_translation else value,
            translator=translator,
            permissions=permissions,
            possible_values=possible_values.get(facet_key, None))

    return facets


def translate_facet(facet, label=None, value=None, translator=None, permissions=None,
                    possible_values=None):
    if not is_translated_facet(facet):
        return make_translated_facet(
            facet,
            label=label,
            value=value,
            translator=translator,
            permissions=permissions,
            possible_values=possible_values)
    else:  # pragma: no cover
        translation = get_translated_facet(facet)
        if translation:
            translation.label = translation.label or label
            translation.value = translation.value or value
            translation.translator = translation.translator or translator
            translation.permissions = translation.permissions or permissions
            translation.possible_values = translation.possible_values or possible_values

    return facet


def keep_facets(facets, **kwargs):
    return translate_facets(facets, label=no_translation, value=no_translation, **kwargs)


def keep_facet(facet, **kwargs):
    return translate_facet(facet, label=no_translation, value=no_translation, **kwargs)
