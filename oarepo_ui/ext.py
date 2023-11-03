import functools
import json
import os
import re
from importlib import import_module
from pathlib import Path
from typing import Dict

from flask import Response, current_app
from frozendict import frozendict
from importlib_metadata import entry_points

import oarepo_ui.cli  # noqa
from oarepo_ui.resources.catalog import OarepoCatalog as Catalog
from oarepo_ui.resources.templating import TemplateRegistry


def crop_component_path(path):
    parent_dir = os.path.dirname(path)

    return parent_dir


def crop_root_path(path, app_theme):
    if app_theme:
        for theme in app_theme:
            if theme in path:
                folder_index = path.index(theme)
                cropped_path = path[: folder_index + len(theme)]

                return cropped_path

    return crop_component_path(path)


def extract_priority(path):
    match, _s = prefix_match(path)
    if match:
        path_parts = path.split("/")
        file_parts = path_parts[-1].split("-")
        return int(file_parts[0])
    return 0


def prefix_match(path):
    match = re.match(r"^(?:.*[\\\/])?\d{3}-.*$", path)
    if match:
        return True, match
    return False, None


def list_templates(env):
    searchpath = []

    path_dict = {}
    for path in env.loader.list_templates():
        try:
            if path.endswith("jinja") or path.endswith("jinja2"):
                priority = extract_priority(path)
                file_name = path.split("/")[-1]
                match, _s = prefix_match(file_name)
                if match:
                    _, _, file_name = file_name.partition("-")
                if file_name not in path_dict or priority > path_dict[file_name][0]:
                    path_dict[file_name] = (priority, path)
        except Exception as e:
            print(e)
    jinja_templates = [
        env.loader.load(env, path) for priority, path in path_dict.values()
    ]

    for temp in jinja_templates:
        app_theme = current_app.config.get("APP_THEME", None)
        searchpath.append(
            {
                "root_path": crop_root_path(temp.filename, app_theme),
                "component_path": crop_component_path(temp.filename),
                "component_file": temp.filename,
            }
        )

    return searchpath


class OARepoUIState:
    def __init__(self, app):
        self.app = app
        self.templates = TemplateRegistry(app, self)
        self._resources = []
        self.layouts = self._load_layouts()
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
        catalog.jinja_env.autoescape = env.autoescape
        context.update(catalog.jinja_env.globals)
        context.update(env.globals)
        catalog.jinja_env.globals = context
        catalog.jinja_env.extensions.update(env.extensions)
        catalog.jinja_env.filters.update(env.filters)
        catalog.jinja_env.policies.update(env.policies)

        env.loader.searchpath = list_templates(catalog.jinja_env)
        catalog.prefixes[""] = catalog.jinja_env.loader

        return catalog

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
