import functools
import json
from pathlib import Path

from flask import Response, current_app
from importlib_metadata import entry_points
from invenio_base.utils import obj_or_import_string

import oarepo_ui.cli  # noqa
from oarepo_ui.resources.templating.catalog import OarepoCatalog as Catalog


class OARepoUIState:
    def __init__(self, app):
        self.app = app
        self._resources = []
        self.init_builder_plugin()
        self._catalog = None

    def reinitialize_catalog(self):
        self._catalog = None
        try:
            del self.catalog  # noqa - this is a documented method of clearing the cache
        except (
            AttributeError
        ):  # but does not work if the cache is not initialized yet, thus the try/except
            pass

    @functools.cached_property
    def catalog(self):
        self._catalog = Catalog()
        return self._catalog_config(self._catalog, self.app.jinja_env)

    def _catalog_config(self, catalog, env):
        context = {}
        env.policies.setdefault("json.dumps_kwargs", {}).setdefault("default", str)
        self.app.update_template_context(context)
        catalog.jinja_env.loader = env.loader

        # autoescape everything (this catalogue is used just for html jinjax components, so can do that) ...
        catalog.jinja_env.autoescape = True

        context.update(catalog.jinja_env.globals)
        context.update(env.globals)
        catalog.jinja_env.globals = context
        catalog.jinja_env.extensions.update(env.extensions)
        catalog.jinja_env.filters.update(env.filters)
        catalog.jinja_env.policies.update(env.policies)

        catalog.prefixes[""] = catalog.jinja_env.loader

        return catalog

    def register_resource(self, ui_resource):
        self._resources.append(ui_resource)

    def get_resources(self):
        return self._resources

    def init_builder_plugin(self):
        if self.app.config["OAREPO_UI_DEVELOPMENT_MODE"]:
            self.app.after_request(self.development_after_request)

    def development_after_request(self, response: Response):
        if current_app.config["OAREPO_UI_BUILD_FRAMEWORK"] == "vite":
            from oarepo_ui.vite import add_vite_tags

            return add_vite_tags(response)

    @property
    def record_actions(self):
        return self.app.config["OAREPO_UI_RECORD_ACTIONS"]

    @functools.cached_property
    def ui_models(self):
        # load all models from json files registered in oarepo.ui entry point
        ret = {}
        eps = entry_points(group="oarepo.ui")
        for ep in eps:
            path = Path(obj_or_import_string(ep.module).__file__).parent / ep.attr
            ret[ep.name] = json.loads(path.read_text())
        return ret


class OARepoUIExtension:
    def __init__(self, app=None):
        if app:
            self.init_app(app)

    def init_app(self, app):
        self.init_config(app)
        app.extensions["oarepo_ui"] = OARepoUIState(app)

    def init_config(self, app):
        """Initialize configuration."""
        from . import config

        for k in dir(config):
            if k.startswith("OAREPO_UI_"):
                app.config.setdefault(k, getattr(config, k))

        # merge in default filters and globals if they have not been overridden
        for k in ("OAREPO_UI_JINJAX_FILTERS", "OAREPO_UI_JINJAX_GLOBALS"):
            for name, val in getattr(config, k).items():
                if name not in app.config[k]:
                    app.config[k][name] = val
