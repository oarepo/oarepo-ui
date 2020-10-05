from oarepo_ui.constants import no_translation
from oarepo_ui.utils import get_oarepo_attr, partial_format


class TranslatedFacet(dict):
    def __init__(self, facet_val, label, value, translator, permissions):
        assert isinstance(facet_val, dict)
        super().__init__(facet_val)
        self.label = label
        self.value = value
        self.translator = translator
        self.permissions = permissions


def make_translated_facet(facet_val, label, value, translator, permissions):
    if callable(facet_val):
        oarepo = get_oarepo_attr(facet_val)
        oarepo['translation'] = TranslatedFacet({}, label, value, translator, permissions)
        return facet_val
    else:
        return TranslatedFacet(facet_val, label, value, translator, permissions)


def is_translated_facet(facet_val):
    if callable(facet_val):
        oarepo = get_oarepo_attr(facet_val)
        translation = oarepo.get('translation', None)
        return translation is not None and isinstance(translation, TranslatedFacet)
    else:
        return isinstance(facet_val, TranslatedFacet)


def translate_facets(facets, label=None, value=None, translator=None, permissions=None):
    for facet_key, facet_val in list(facets.items()):
        if not is_translated_facet(facet_val):
            facets[facet_key] = make_translated_facet(
                facet_val,
                label=partial_format(label, facet_key=facet_key) if label and label is not no_translation else label,
                value=partial_format(value, facet_key=facet_key) if value is not no_translation else value,
                translator=translator,
                permissions=permissions)

    return facets


def translate_facet(facet, label=None, value=None, translator=None, permissions=None):
    if not is_translated_facet(facet):
        return make_translated_facet(
            facet,
            label=label,
            value=value,
            translator=translator,
            permissions=permissions)
    return facet


def keep_facets(facets, **kwargs):
    return translate_facets(facets, label=no_translation, value=no_translation, **kwargs)


def keep_facet(facet, **kwargs):
    return translate_facet(facet, label=no_translation, value=no_translation, **kwargs)
