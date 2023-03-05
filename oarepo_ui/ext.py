import functools
import json
import os
from functools import cached_property
from pathlib import Path
from typing import Dict

from importlib_metadata import entry_points
from jinja2.environment import TemplateModule
from werkzeug.utils import import_string
from frozendict import frozendict

from oarepo_ui.resources.templating import TemplateRegistry

from importlib_metadata import entry_points
from importlib import import_module

import oarepo_ui.cli  # noqa


class OARepoUIState:
    def __init__(self, app):
        self.app = app
        self.templates = TemplateRegistry(app, self)
        self._resources = []
        self.layouts = self._load_layouts()

    def get_template(self, layout: str, blocks: Dict[str, str]):
        return self.templates.get_template(layout, frozendict(blocks))

    def register_resource(self, ui_resource):
        self._resources.append(ui_resource)

    def get_resources(self):
        return self._resources

    def get_layout(self, layout_name):
        return self.layouts[layout_name]

    def _load_layouts(self):
        layouts = {}
        for ep in entry_points(group="oarepo.ui"):
            m = import_module(ep.module)
            path = Path(m.__file__).parent / ep.attr
            layouts[ep.name] = json.loads(path.read_text())
        return layouts


class OARepoUIExtension:
    def __init__(self, app=None):
        if app:
            self.init_app(app)

    def init_app(self, app):
        app.extensions["oarepo_ui"] = OARepoUIState(app)
