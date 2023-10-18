import os
import re
from pathlib import Path
from jinjax.component import Component
import jinja2
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
                    _filepath = curr_folder + "/" + filename
                    in_searchpath = False
                    for searchpath in self.jinja_env.loader.searchpath:
                        if _filepath == searchpath["component_file"]:
                            in_searchpath = True
                            break
                    if in_searchpath:
                        prefix_pattern = re.compile(r"^\d{3}-")
                        without_prefix_filename = filename
                        if prefix_pattern.match(filename):
                            # Remove the prefix
                            without_prefix_filename = prefix_pattern.sub("", filename)
                        if relfolder:
                            filepath = f"{relfolder}/{without_prefix_filename}"
                        else:
                            filepath = without_prefix_filename
                        if filepath.startswith(name_dot) and filepath.endswith(
                            file_ext
                        ):
                            return (
                                Path(root_path["root_path"]),
                                Path(curr_folder) / filename,
                            )

        raise ComponentNotFound(
            f"Unable to find a file named {name}{file_ext} "
            f"or one following the pattern {name_dot}*{file_ext}"
        )

    def _get_from_file(self, *, prefix: str, name: str, url_prefix: str, file_ext: str) -> "Component":
        root_path, path = self._get_component_path(prefix, name, file_ext=file_ext)
        component = Component(
            name=name,
            url_prefix=url_prefix,
            path=path,
        )
        tmpl_name = str(path.relative_to(root_path))

        component.tmpl = self.jinja_env.get_template(tmpl_name)
        return component


def get_jinja_template(_catalog, template_def, fields=None):
    if fields is None:
        fields = []
    jinja_content = None
    for component in _catalog.jinja_env.loader.searchpath:
        if component["component_file"].endswith(template_def["layout"]):
            with open(component["component_file"], "r") as file:
                jinja_content = file.read()
    if not jinja_content:
        raise Exception("%s was not found" % (template_def["layout"]))
    assembled_template = [jinja_content]
    if "blocks" in template_def:
        for blk_name, blk in template_def["blocks"].items():
            component_content = ""
            for field in fields:
                component_content = component_content + "%s={%s} " % (field, field)
            component_str = "<%s %s> </%s>" % (blk, component_content, blk)
            assembled_template.append(
                "{%% block %s %%}%s{%% endblock %%}" % (blk_name, component_str)
            )
    assembled_template = "\n".join(assembled_template)
    return assembled_template


def lazy_string_encoder(obj):
    if isinstance(obj, list):
        return [lazy_string_encoder(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: lazy_string_encoder(value) for key, value in obj.items()}
    else:
        return str(obj)
