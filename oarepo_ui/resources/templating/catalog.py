import os
import re
import typing as t
from collections import namedtuple
from itertools import chain
from pathlib import Path
from typing import Dict, Tuple

import flask
import jinja2
from flask import current_app
from flask.globals import request
from jinjax import Catalog
from jinjax.exceptions import ComponentNotFound
from jinjax.jinjax import JinjaX

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
    __slots__ = Catalog.__slots__ + ("_component_paths",)

    def __init__(
        self,
        *,
        globals: "dict[str, t.Any] | None" = None,
        filters: "dict[str, t.Any] | None" = None,
        tests: "dict[str, t.Any] | None" = None,
        extensions: "list | None" = None,
        jinja_env: "jinja2.Environment | None" = None,
        root_url: str = DEFAULT_URL_ROOT,
        file_ext: "TFileExt" = DEFAULT_EXTENSION,
        use_cache: bool = True,
        auto_reload: bool = True,
    ) -> None:
        self.prefixes: "dict[str, jinja2.FileSystemLoader]" = {}
        self.collected_css: "list[str]" = []
        self.collected_js: "list[str]" = []
        self.file_ext = file_ext
        self.use_cache = use_cache
        self.auto_reload = auto_reload

        root_url = root_url.strip().rstrip(SLASH)
        self.root_url = f"{root_url}{SLASH}"
        env = flask.templating.Environment(
            undefined=jinja2.Undefined, app=current_app, autoescape=True
        )
        extensions = [*(extensions or []), "jinja2.ext.do", JinjaX]
        globals = globals or {}
        current_app.config.setdefault(
            "DEPLOYMENT_VERSION",
            os.environ.get("DEPLOYMENT_VERSION", "local development"),
        )
        filters = filters or {}
        tests = tests or {}

        if jinja_env:
            env.extensions.update(jinja_env.extensions)
            globals.update(jinja_env.globals)
            filters.update(jinja_env.filters)
            tests.update(jinja_env.tests)
            jinja_env.globals["catalog"] = self
            jinja_env.filters["catalog"] = self

        globals["catalog"] = self
        filters["catalog"] = self

        for ext in extensions:
            env.add_extension(ext)
        env.globals.update(globals)
        env.filters.update(filters)
        env.tests.update(tests)
        env.extend(catalog=self)

        self.jinja_env = env

        self.tmpl_globals: t.MutableMapping[str, t.Any] | None = None
        self._cache: "dict[str, dict]" = {}

    def update_template_context(self, context: dict) -> None:
        """Update the template context with some commonly used variables.
        This injects request, session, config and g into the template
        context as well as everything template context processors want
        to inject.  Note that the as of Flask 0.6, the original values
        in the context will not be overridden if a context processor
        decides to return a value with the same key.

        :param context: the context as a dictionary that is updated in place
                        to add extra variables.
        """
        names: t.Iterable[t.Optional[str]] = (None,)

        # A template may be rendered outside a request context.
        if request:
            names = chain(names, reversed(request.blueprints))

        # The values passed to render_template take precedence. Keep a
        # copy to re-apply after all context functions.

        for name in names:
            if name in self.jinja_env.app.template_context_processors:
                for func in self.jinja_env.app.template_context_processors[name]:
                    extra_context = func()
                    for k, v in (extra_context or {}).items():
                        if k not in context:
                            context[k] = v

    def render(
        self,
        __name: str,
        *,
        caller: "t.Callable | None" = None,
        **kw,
    ) -> str:
        self.collected_css = []
        self.collected_js = []
        return self.irender(__name, caller=caller, **kw)

    def get_source(self, cname: str, file_ext: "TFileExt" = "") -> str:
        prefix, name = self._split_name(cname)
        _root_path, path = self._get_component_path(prefix, name, file_ext=file_ext)
        return Path(path).read_text()

    @property
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
        if hasattr(self, "_component_paths"):
            return self._component_paths

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
                    or partial_priority > paths[partial_template_name][2]
                ):
                    paths[partial_template_name] = (
                        absolute_template_path,
                        relative_template_path,
                        partial_priority,
                    )

        self._component_paths = {k: (v[0], v[1]) for k, v in paths.items()}
        return self._component_paths

    @component_paths.deleter
    def component_paths(self):
        self._component_paths = {}

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

    # component handling: currently Component class is not replaceable, so we need to override the following
    # methods to add global context to the component rendering

    def _get_from_source(
        self, *, name: str, url_prefix: str, source: str
    ) -> "Component":
        return KeepGlobalContextComponent(
            self,
            super()._get_from_source(name=name, url_prefix=url_prefix, source=source),
        )

    def _get_from_cache(
        self, *, prefix: str, name: str, url_prefix: str, file_ext: str
    ) -> "Component":
        return KeepGlobalContextComponent(
            self,
            super()._get_from_cache(
                prefix=prefix, name=name, url_prefix=url_prefix, file_ext=file_ext
            ),
        )

    def _get_from_file(
        self, *, prefix: str, name: str, url_prefix: str, file_ext: str
    ) -> "Component":
        return KeepGlobalContextComponent(
            self,
            super()._get_from_file(
                prefix=prefix, name=name, url_prefix=url_prefix, file_ext=file_ext
            ),
        )


class KeepGlobalContextComponent:
    def __init__(self, __catalogue, __component):
        self.__component = __component
        self.__catalogue = __catalogue

    def filter_args(self, kwargs):
        props, extras = self.__component.filter_args(kwargs)
        self.__catalogue.update_template_context(props)
        return props, extras

    def __getattr__(self, item):
        return getattr(self.__component, item)


def strip_app_theme(template_name, app_theme):
    if app_theme:
        for theme in app_theme:
            if template_name.startswith(f"{theme}/"):
                return template_name[len(theme) + 1 :], True
    return template_name, False
