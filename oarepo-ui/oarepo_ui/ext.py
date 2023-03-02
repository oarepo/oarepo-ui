import functools
import json
import os
from functools import cached_property
from typing import Dict

from importlib_metadata import entry_points
from jinja2.environment import TemplateModule
from werkzeug.utils import import_string
from frozendict import frozendict

from oarepo_ui.resources.templating import TemplateRegistry


class OARepoUIState:
    def __init__(self, app):
        self.app = app
        self.templates = TemplateRegistry(app, self)
        self._resources = []

    def get_template(self, layout: str, blocks: Dict[str, str]):
        return self.templates.get_template(layout, frozendict(blocks))

    def register_resource(self, ui_resource):
        self._resources.append(ui_resource)

    def get_resources(self):
        return self._resources


class OARepoUIExtension:
    def __init__(self, app=None):
        if app:
            self.init_app(app)

    def init_app(self, app):
        app.extensions["oarepo_ui"] = OARepoUIState(app)
