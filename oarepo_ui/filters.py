from oarepo_ui.constants import no_translation
from oarepo_ui.utils import get_oarepo_attr, partial_format


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
                partial_format(label, filter_key=filter_key) if label and label is not no_translation else label,
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
