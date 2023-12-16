import functools

from flask import Response, current_app

import oarepo_ui.cli  # noqa
from oarepo_ui.resources.catalog import OarepoCatalog as Catalog
from oarepo_ui.resources.templating import TemplateRegistry


class OARepoUIState:
    def __init__(self, app):
        self.app = app
        self.templates = TemplateRegistry(app, self)
        self._resources = []
        self.init_builder_plugin()
        self._catalog = None

    @functools.cached_property
    def catalog(self):
        self._catalog = Catalog()
        return self._catalog_config(self._catalog, self.templates.jinja_env)

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
