import json
from collections import defaultdict

import pkg_resources
from werkzeug.utils import cached_property


class OARepoUIState:
    def __init__(self, app):
        self.app = app

    # TODO: change to cached_property
    @property
    def contexts(self):
        # iterate all the models and get their oarepo:ui sections
        ret = defaultdict(dict)
        for model_ep in pkg_resources.iter_entry_points('oarepo_ui.models'):
            self.load_model_uidata(ret, model_ep.module_name, model_ep.name, model_ep.load().uidata)
        return ret

    @cached_property
    def context_check_callbacks(self):
        ret = []
        for model_ep in pkg_resources.iter_entry_points('oarepo_ui.context_check'):
            ret.append(model_ep.load())
        return ret

    def check_oarepo_context(self, context_name: str, identity):
        for callback in self.context_check_callbacks:
            callback(context_name, identity)

    def get_context(self, context_id):
        return self.contexts.get(context_id, None)

    def load_model_uidata(self, contexts, module_name, model_name, uidata):
        for context_name in uidata['context_names']:
            context = json.loads(pkg_resources.resource_string(module_name, f'contexts/{context_name}.json'))
            contexts[context_name][model_name] = {
                **context,
                "settings": {
                    'languages': uidata['language_names'],
                    'default_language': uidata['default_language']
                }
            }


class OARepoUIExt:
    def __init__(self, app, db=None):
        # disable automatic options because we provide our own
        app.extensions['oarepo-ui'] = OARepoUIState(app)
