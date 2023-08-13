import os
from pathlib import Path

import jinja2
from flask import current_app
from jinjax import Catalog
from jinjax.exceptions import ComponentNotFound

DEFAULT_URL_ROOT = "/static/components/"
ALLOWED_EXTENSIONS = (".css", ".js")
DEFAULT_PREFIX = ""
DEFAULT_EXTENSION = ".jinja"
DELIMITER = "."
SLASH = "/"
PROP_ATTRS = "attrs"
PROP_CONTENT = "content"


class OarepoCatalog(Catalog):
    singleton_check = None

    def __init__(self):
        super().__init__()
        self.jinja_env.undefined = jinja2.Undefined
        self.singleton_check = False

    def set_config(self):
        self.singleton_check = True

    def get_source(self, cname: str, file_ext: "TFileExt" = "") -> str:
        prefix, name = self._split_name(cname)
        _root_path, path = self._get_component_path(prefix, name, file_ext=file_ext)
        return Path(path).read_text()

    def _get_component_path(
        self, prefix: str, name: str, file_ext: "TFileExt" = ""
    ) -> "tuple[Path, Path]":
        name = name.replace(DELIMITER, SLASH)
        name_dot = f"{name}."
        file_ext = file_ext or self.file_ext
        root_paths = self.prefixes[prefix].searchpath

        for root_path in root_paths:
            component_path = root_path["component_path"]
            for curr_folder, _folders, files in os.walk(
                component_path, topdown=False, followlinks=True
            ):
                relfolder = os.path.relpath(curr_folder, component_path).strip(".")
                if relfolder and not name_dot.startswith(relfolder):
                    continue

                for filename in files:
                    if relfolder:
                        filepath = f"{relfolder}/{filename}"
                    else:
                        filepath = filename
                    if filepath.startswith(name_dot) and filepath.endswith(file_ext):
                        return (
                            Path(root_path["root_path"]),
                            Path(curr_folder) / filename,
                        )

        raise ComponentNotFound(
            f"Unable to find a file named {name}{file_ext} "
            f"or one following the pattern {name_dot}*{file_ext}"
        )


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


def list_templates(env):
    searchpath = []
    jinja_templates = []
    for i in env.loader.list_templates():
        try:
            if i.endswith("jinja") or i.endswith("jinja2"):
                jinja_templates.append(env.loader.load(env, i))
        except:
            pass
    for temp in jinja_templates:
        app_theme = current_app.config.get("APP_THEME", None)
        searchpath.append(
            {
                "root_path": crop_root_path(temp.filename, app_theme),
                "component_path": crop_component_path(temp.filename),
                    'component_file': temp.filename
            }
        )

    return searchpath


def catalog_config(catalog, env):
    context = {}
    current_app.update_template_context(context)
    catalog.jinja_env.loader = env.loader
    context.update(catalog.jinja_env.globals)
    context.update(env.globals)
    catalog.jinja_env.globals = context
    env.loader.searchpath = list_templates(env)
    catalog.prefixes[""] = env.loader

    return catalog

def get_jinja_template(_catalog, template_def):
    for component in _catalog.jinja_env.loader.searchpath:
        if component['component_file'].endswith(template_def['layout']):
            with open(component['component_file'], 'r') as file:
                jinja_content = file.read()
    assembled_template = [jinja_content]
    for blk_name, blk in template_def['blocks'].items():
        assembled_template.append(
                '{%% block %s %%}<%s metadata={{metadata}} ui={{ui}} layout={{layout}}></%s>{%% endblock %%}' % (blk_name, blk, blk)
        )
    assembled_template = "\n".join(assembled_template)
    return assembled_template