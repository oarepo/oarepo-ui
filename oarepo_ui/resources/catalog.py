import re
from collections import namedtuple
from functools import cached_property
from pathlib import Path
from typing import Dict, Tuple

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


SearchPathItem = namedtuple(
    "SearchPath", ["template_name", "absolute_path", "relative_path", "priority"]
)


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
        The component name is either the filename without the '.jinja' suffix
        (such as "DetailPage"), or it is a namespaced name (such as
        "oarepo_vocabularies.DetailPage").

        Note: current theme (such as semantic-ui) is stripped from the namespace.

        To invalidate the cache, call `del self.component_paths`.

        Example keys:
            * "DetailPage" -> DetailPage.jinja
            * "oarepo_vocabularies.DetailPage" -> oarepo_vocabularies/DetailPage.jinja
            * "oarepo_vocabularies.DetailPage" -> semantic-ui/oarepo_vocabularies/DetailPage.jinja

        The method also adds partial keys to the cache with lower priority (-10 for each omitted segment),
        so that the following are also added:

            * "DetailPage" -> oarepo_vocabularies/DetailPage.jinja (priority -10)
        """
        paths: Dict[str, Tuple[Path, Path, int]] = {}

        for (
            template_name,
            absolute_template_path,
            relative_template_path,
            priority,
        ) in self.list_templates():
            split_template_name = template_name.split(DELIMITER)

            for idx in range(0, len(split_template_name)):
                partial_template_name = DELIMITER.join(split_template_name[idx:])
                partial_priority = priority - idx * 10

                # if the priority is greater, replace the path
                if (
                    partial_template_name not in paths
                    or partial_priority > paths[template_name][2]
                ):
                    paths[partial_template_name] = (
                        absolute_template_path,
                        relative_template_path,
                        partial_priority,
                    )

        return {k: (v[0], v[1]) for k, v in paths.items()}

    def _extract_priority(self, filename):
        # check if there is a priority on the file, if not, take default 0
        prefix_pattern = re.compile(r"^\d{3}-")
        priority = 0
        if prefix_pattern.match(filename):
            # Remove the priority from the filename
            priority = int(filename[:3])
            filename = filename[4:]
        return filename, priority

    def _get_component_path(
        self, prefix: str, name: str, file_ext: "TFileExt" = ""
    ) -> "tuple[Path, Path]":
        name = name.replace(SLASH, DELIMITER)

        paths = self.component_paths
        if name in paths:
            return paths[name]

        if self.jinja_env.auto_reload:
            # clear cache
            del self.component_paths

            paths = self.component_paths
            if name in paths:
                return paths[name]

        raise ComponentNotFound(name)

    def list_templates(self):
        searchpath = []

        app_theme = current_app.config.get("APP_THEME", None)

        for path in self.jinja_env.loader.list_templates():
            if not path.endswith(DEFAULT_EXTENSION):
                continue
            jinja_template = self.jinja_env.loader.load(self.jinja_env, path)
            absolute_path = Path(jinja_template.filename)
            template_name, stripped = strip_app_theme(jinja_template.name, app_theme)

            template_name = template_name[: -len(DEFAULT_EXTENSION)]
            template_name = template_name.replace(SLASH, DELIMITER)

            # extract priority
            split_name = list(template_name.rsplit(DELIMITER, 1))
            split_name[-1], priority = self._extract_priority(split_name[-1])
            template_name = DELIMITER.join(split_name)

            if stripped:
                priority += 10

            searchpath.append(
                SearchPathItem(template_name, absolute_path, path, priority)
            )

        return searchpath


def strip_app_theme(template_name, app_theme):
    if app_theme:
        for theme in app_theme:
            if template_name.startswith(f"{theme}/"):
                return template_name[len(theme) + 1 :], True
    return template_name, False
