import json
from importlib import import_module
from pathlib import Path
from typing import Dict

from flask import Response, current_app
from frozendict import frozendict
from importlib_metadata import entry_points

import oarepo_ui.cli  # noqa
from oarepo_ui.resources.templating import TemplateRegistry


class OARepoUIState:
    def __init__(self, app):
        self.app = app
        self.templates = TemplateRegistry(app, self)
        self._resources = []
        self.layouts = self._load_layouts()
        self.init_builder_plugin()

    def get_template(self, layout: str, blocks: Dict[str, str]):
        return self.templates.get_template(layout, frozendict(blocks))

    def register_resource(self, ui_resource):
        self._resources.append(ui_resource)

    def get_resources(self):
        return self._resources

    def get_layout(self, layout_name):
        return self.layouts.get(layout_name, {})

    def _load_layouts(self):
        layouts = {}
        for ep in entry_points(group="oarepo.ui"):
            m = import_module(ep.module)
            path = Path(m.__file__).parent / ep.attr
            layouts[ep.name] = json.loads(path.read_text())
        return layouts

    def init_builder_plugin(self):
        if self.app.config["OAREPO_UI_DEVELOPMENT_MODE"]:
            self.app.after_request(self.development_after_request)

    def development_after_request(self, response: Response):
        if current_app.config["OAREPO_UI_BUILD_FRAMEWORK"] == "vite":
            from oarepo_ui.vite import add_vite_tags

            return add_vite_tags(response)


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
