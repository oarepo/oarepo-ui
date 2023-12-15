import os
import re
from functools import cached_property
from pathlib import Path
from typing import Dict, Tuple

import jinja2
from jinjax import Catalog
from jinjax.component import Component
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

    @cached_property
    def component_paths(self) -> Dict[str, Tuple[Path, Path]]:
        """
        Returns a cache of component-name => (root_path, component_path).
        To invalidate the cache, call `del self.component_paths`.
        """
        paths: Dict[str, Tuple[Path, Path, int]] = {}

        # paths known by the current jinja environment
        search_paths = {
            Path(searchpath["component_file"]) for searchpath in self.jinja_env.loader.searchpath
        }

        # iterate all the files inside prefixes
        for prefix in self.prefixes:
            root_paths = self.prefixes[prefix].searchpath

            for root_path_rec in root_paths:
                component_path = root_path_rec["component_path"]
                root_path = Path(root_path_rec["root_path"])

                for curr_folder, _folders, files in os.walk(
                    component_path, topdown=False, followlinks=True
                ):
                    # the file might be in a subfolder of the component_path, so get the subfolder name
                    relfolder = os.path.relpath(curr_folder, component_path).strip(".")

                    for filename in files:

                        # if the file is known to the current jinja environment,
                        # get the priority and add it to known components
                        absolute_filepath = Path(curr_folder) / filename
                        if absolute_filepath in search_paths:

                            # check if there is a priority on the file, if not, take default 0
                            prefix_pattern = re.compile(r"^\d{3}-")
                            priority = 0
                            if prefix_pattern.match(filename):
                                # Remove the priority from the filename
                                priority = int(filename[:3])
                                filename = filename[4:]

                            if relfolder:
                                relative_filepath = f"{relfolder}/{filename}"
                            else:
                                relative_filepath = filename

                            # if the priority is greater, replace the path
                            if relative_filepath not in paths or priority > paths[relative_filepath][2]:
                                paths[relative_filepath] = (
                                    root_path,
                                    absolute_filepath,
                                    priority)
        return {
            k: (v[0], v[1]) for k, v in paths.items()
        }

    def _get_component_path(
        self, prefix: str, name: str, file_ext: "TFileExt" = ""
    ) -> "tuple[Path, Path]":

        file_ext = file_ext or self.file_ext
        if not file_ext.startswith("."):
            file_ext = "." + file_ext
        name = name.replace(SLASH, DELIMITER) + file_ext

        paths = self.component_paths
        if name in paths:
            return paths[name]

        if self.jinja_env.auto_reload:
            # clear cache
            del self.component_paths

            paths = self.component_paths
            if name in paths:
                return paths[name]

        raise ComponentNotFound(
            f"Unable to find a file named {name}"
        )


    def _get_from_file(
        self, *, prefix: str, name: str, url_prefix: str, file_ext: str
    ) -> "Component":
        root_path, path = self._get_component_path(prefix, name, file_ext=file_ext)
        component = Component(
            name=name,
            url_prefix=url_prefix,
            path=path,
        )
        tmpl_name = str(path.relative_to(root_path))

        component.tmpl = self.jinja_env.get_template(tmpl_name)
        return component


def lazy_string_encoder(obj):
    if isinstance(obj, list):
        return [lazy_string_encoder(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: lazy_string_encoder(value) for key, value in obj.items()}
    else:
        return str(obj)
