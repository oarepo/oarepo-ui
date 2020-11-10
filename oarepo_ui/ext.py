from flask import url_for
from invenio_base.utils import obj_or_import_string
from invenio_records_rest.views import RecordsListResource
from werkzeug.utils import cached_property

from oarepo_ui import no_translation
from oarepo_ui.facets import TranslatedFacet, get_translated_facet
from oarepo_ui.filters import TranslatedFilter, get_oarepo_attr
from oarepo_ui.utils import partial_format


class OARepoUIState:
    def __init__(self, app):
        self.app = app

    @cached_property
    def endpoints(self):
        endpoints = []
        for name, config in self.app.config.get('RECORDS_REST_ENDPOINTS', {}).items():
            if not config.get('list_route'):
                continue
            endpoints.append({
                'list_route': config.get('list_route'),
                'name': name,
                'config': config
            })
        return endpoints

    @cached_property
    def translator(self):
        return obj_or_import_string(
            self.app.config.get('OAREPO_UI_TRANSLATOR',
                                'oarepo_ui.translation.default_translator'))

    @cached_property
    def permission_factory(self):
        return obj_or_import_string(
            self.app.config.get('OAREPO_UI_FACET_PERMISSION_FACTORY',
                                'oarepo_ui.translation.default_permission_factory'))

    @property
    def facets(self):
        return self.app.config.get('RECORDS_REST_FACETS', {})

    @cached_property
    def indices(self):
        return list(self.facets.keys())

    def get_index(self, index_name):
        index = self.facets[index_name]
        return {
            'facets': self._translate_facets(index.get('aggs', {}), index_name=index_name, index=index),
            'filters': self._translate_filters(index.get('filters', {}), index_name=index_name, index=index),
            'endpoints': self._generate_endpoints(index_name)
        }

    def _generate_endpoints(self, index_name):
        endpoints = {}
        for name, config in self.app.config.get('RECORDS_REST_ENDPOINTS', {}).items():
            search_index = config.get('search_index', None)
            if search_index == index_name:
                endpoints[name] = {
                    'url': url_for('invenio_records_rest.{0}_list'.format(name), _external=True),
                    'pid_type': config.get('pid_type', None)
                }
        return endpoints

    def _translate_facets(self, facets, index_name, **kwargs):
        if facets is None:
            return None

        ret = []
        for k, facet in facets.items():
            translation: TranslatedFacet = get_translated_facet(facet)

            if translation is not None:
                if not (translation.permissions or self.permission_factory)(
                        facets=facets, facet_name=k,
                        facet=facet, index_name=index_name, **kwargs).can():
                    continue
                translated = {
                    'code': k,
                    'facet': {
                        'label': self.translate_facet_label(translation.label, k, translation.translator, **kwargs)
                        if translation.label is not no_translation else k
                    }
                }
                if translation.possible_values:
                    if isinstance(translation.possible_values, list):
                        translated['facet']['values'] = {
                            x: self.translate_facet_value(translation.value, k, x, translation.translator,
                                                          **kwargs)
                            for x in translation.possible_values
                        }
                    else:
                        translated['facet']['values'] = {
                            value_key: value_translation
                            for value_key, value_translation in translation.possible_values.items()
                        }

                ret.append(translated)
            else:
                if not self.permission_factory(facets=facets, facet_name=k, facet=facet,
                                               index_name=index_name, **kwargs).can():
                    continue
                ret.append({
                    'code': k,
                    'facet': {
                        'label': self.translate_facet_label(f'oarepo.facets.{index_name}.{{facet_key}}.label',
                                                            k, self.translator, **kwargs)
                    }
                })
        return ret

    def _translate_filters(self, filters, index_name, **kwargs):
        if filters is None:
            return None

        def _translate(k, filter):
            translation: TranslatedFilter = get_oarepo_attr(filter).get('translation')
            if translation:
                ret = {
                    'label': self.translate_filter_label(translation.label, k, translation.translator, **kwargs)
                    if translation.label is not no_translation else k
                }
                if translation.type is not None:
                    ret['type'] = translation.type
                return ret
            else:
                return {
                    'label': self.translate_filter_label(f'oarepo.filters.{index_name}.{{filter_key}}.label',
                                                         k, self.translator, **kwargs)
                }

        return [
            {
                'code': k,
                'filter': _translate(k, v)
            } for k, v in filters.items()
        ]

    def translate_facet_label(self, label, facet_key, translator, **kwargs):
        translator = translator or self.translator
        return translator(key=partial_format(label, facet_key=facet_key), **kwargs)

    def translate_filter_label(self, label, filter_key, translator, **kwargs):
        translator = translator or self.translator
        return translator(key=partial_format(label, filter_key=filter_key), **kwargs)

    def translate_facet_value(self, value, facet_key, value_key, translator, **kwargs):
        translator = translator or self.translator
        return translator(key=partial_format(value, facet_key=facet_key, value_key=value_key), **kwargs)


class OARepoUIExt:
    def __init__(self, app, db=None):
        # disable automatic options because we provide our own
        RecordsListResource.provide_automatic_options = False
        app.extensions['oarepo-ui'] = OARepoUIState(app)
