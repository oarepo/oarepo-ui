#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI templating catalog module.

This module provides an extended Jinjax catalog implementation for OARepo UI,
including component rendering with asset management, template loading,
and integration with Flask's static file serving for CSS and JavaScript assets.
"""

from __future__ import annotations

import re
from itertools import chain
from pathlib import Path
from typing import TYPE_CHECKING, Any, NamedTuple, cast, override

import flask
import jinja2
from flask import current_app
from flask.globals import request
from jinjax import Catalog
from jinjax.exceptions import ComponentNotFound
from jinjax.jinjax import JinjaX

if TYPE_CHECKING:
    from collections.abc import Callable, Iterable

    from flask import Flask
    from jinjax import Component

DEFAULT_URL_ROOT = "/static/components/"
ALLOWED_EXTENSIONS = (".css", ".js")
DEFAULT_PREFIX = ""
DEFAULT_EXTENSION = ".jinja"
DELIMITER = "."
SLASH = "/"
PROP_ATTRS = "attrs"
PROP_CONTENT = "content"


class SearchPathItem(NamedTuple):
    """Named tuple for search path items in the Jinjax catalog."""

    template_name: str
    absolute_path: Path
    relative_path: Path
    priority: int


class OarepoCatalog(Catalog):
    """Extended Jinjax catalog for OARepo UI templating."""

    __slots__ = (*Catalog.__slots__, "_component_paths")
    _component_paths: dict[str, tuple[Path, Path]]

    @override
    def __init__(
        self,
        *,
        globals: dict[str, Any] | None = None,
        filters: dict[str, Any] | None = None,
        tests: dict[str, Any] | None = None,
        extensions: list | None = None,
        jinja_env: jinja2.Environment | None = None,
        root_url: str = DEFAULT_URL_ROOT,
        file_ext: str = DEFAULT_EXTENSION,
        use_cache: bool = True,
        auto_reload: bool = True,
    ) -> None:
        """Initialize OarepoCatalog for OARepo UI templating.

        :param globals: Global variables for Jinja2 environment.
        :param filters: Jinja2 filter functions.
        :param tests: Jinja2 test functions.
        :param extensions: Jinja2 extensions.
        :param jinja_env: Existing Jinja2 environment.
        :param root_url: Root URL for static assets.
        :param file_ext: Default file extension for templates.
        :param use_cache: Whether to use template cache.
        :param auto_reload: Whether to auto-reload templates.
        """
        self._key = id(self)
        self.prefixes: dict[str, jinja2.FileSystemLoader] = {}
        self.collected_css: list[str] = []
        self.collected_js: list[str] = []
        self.file_ext = file_ext
        self.use_cache = use_cache
        self.auto_reload = auto_reload

        root_url = root_url.strip().rstrip(SLASH)
        self.root_url = f"{root_url}{SLASH}"
        env = flask.templating.Environment(undefined=jinja2.Undefined, app=current_app, autoescape=True)
        extensions = [*(extensions or []), "jinja2.ext.do", JinjaX]
        globals = globals or {}  # noqa: A001
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

        self.tmpl_globals: dict[str, Any] = {}
        self._cache: dict[str, dict] = {}

    def update_template_context(self, context: dict) -> None:
        """Update the template context with common Flask variables.

        Injects request, session, config, and g into the template context,
        as well as values from template context processors. The reason for this
        is to ensure that jinjax components can always access these variables without
        needing to pass them explicitly in every component call.

        :param context: Dictionary to update in place with extra variables.
        """
        names: Iterable[str | None] = (None,)

        # A template may be rendered outside a request context.
        if request:
            names = chain(names, reversed(request.blueprints))

        # The values passed to render_template take precedence. Keep a
        # copy to re-apply after all context functions.

        for name in names:
            app: Flask = getattr(self.jinja_env, "app", None)  # type: ignore[assignment]
            if app is None:
                raise RuntimeError(
                    "Jinjax catalog is not bound to a Flask app. "
                    "Ensure the catalog is initialized within an app context."
                )
            if name in app.template_context_processors:
                for func in app.template_context_processors[name]:
                    extra_context = func()
                    if not isinstance(extra_context, dict):
                        raise TypeError(
                            f"Template context processor {func} did not return a dict, awaitable not supported yet."
                        )
                    for k, v in (extra_context or {}).items():
                        if k not in context:
                            context[k] = v

    @override
    def render(
        self,
        /,
        __name: str,
        *,
        caller: Callable | None = None,
        **kw: Any,
    ) -> str:
        """Render a template by name, collecting CSS and JS assets.

        :param __name: Name of the template to render.
        :param caller: Optional callable for template blocks.
        :param kw: Additional keyword arguments for rendering.

        :return: Rendered template as a string.
        """
        self.collected_css = []
        self.collected_js = []
        # mypy does not understand that irender returns str
        return self.irender(__name, caller=caller, **kw)  # type: ignore[no-any-return]

    def render_first_existing(
        self,
        names: list[str],
        *,
        caller: Callable | None = None,
        **kw: Any,
    ) -> str:
        """Render the first existing template from a list of names.

        :param names: List of template names to try.
        :param caller: Optional callable for template blocks.
        :param kw: Additional keyword arguments for rendering.

        :return: Rendered template as a string.

        :raises ComponentNotFound: If none of the templates exist.
        """
        for name in names:
            try:
                # mypy does not understand that irender returns str
                return self.irender(name, caller=caller, **kw)  # type: ignore[no-any-return]
            except ComponentNotFound:
                pass

        raise ComponentNotFound(str(names), self.file_ext)

    @override
    def get_source(self, cname: str, file_ext: str = "") -> str:
        """Get the source code of a template by component name.

        :param cname: Component name.
        :param file_ext: File extension for the template.

        :return: Source code of the template as a string.
        """
        prefix, name = self._split_name(cname)
        _root_path, path = self._get_component_path(prefix, name, file_ext=file_ext)
        return Path(path).read_text()

    @property
    def component_paths(self) -> dict[str, tuple[Path, Path]]:
        """Return a cache mapping component names to their template paths.

        The cache maps component names to (root_path, component_path) tuples.
        Partial keys are added with lower priority for fallback resolution.

        :return: Dictionary mapping component names to template paths.
        """
        if getattr(self, "_component_paths", None):
            return self._component_paths

        paths: dict[str, tuple[Path, Path, int]] = {}

        for (
            template_name,
            absolute_template_path,
            relative_template_path,
            priority,
        ) in self.list_templates():
            split_template_name = template_name.split(DELIMITER)

            for idx in range(len(split_template_name)):
                partial_template_name = DELIMITER.join(split_template_name[idx:])
                partial_priority = priority - idx * 10

                # if the priority is greater, replace the path
                if partial_template_name not in paths or partial_priority > paths[partial_template_name][2]:
                    paths[partial_template_name] = (
                        absolute_template_path,
                        relative_template_path,
                        partial_priority,
                    )

        self._component_paths = {k: (v[0], v[1]) for k, v in paths.items()}
        return self._component_paths

    @component_paths.deleter
    def component_paths(self) -> None:
        """Invalidate the component paths cache."""
        self._component_paths = {}

    def _extract_priority(self, filename: str) -> tuple[str, int]:
        """Extract priority from a filename prefix (e.g., '001-').

        :param filename: Filename string.
        :return: Tuple of (filename without prefix, priority as int).
        """
        # check if there is a priority on the file, if not, take default 0
        prefix_pattern = re.compile(r"^\d{3}-")
        priority = 0
        if prefix_pattern.match(filename):
            # Remove the priority from the filename
            priority = int(filename[:3])
            filename = filename[4:]
        return filename, priority

    @override
    def _get_component_path(self, prefix: str, name: str, file_ext: str = "") -> tuple[Path, Path]:
        """Get the absolute and relative path for a component template.

        :param prefix: Prefix for the component.
        :param name: Component name.
        :param file_ext: File extension for the template.
        :raises ComponentNotFound: If the component is not found.
        :return: Tuple of (root_path, component_path).
        """
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

        raise ComponentNotFound(name, self.file_ext)

    def list_templates(self) -> list[SearchPathItem]:
        """List all available templates in the Jinja2 environment.

        :return: List of SearchPathItem namedtuples for templates.
        """
        searchpath = []

        app_theme = cast("list[str]", current_app.config.get("APP_THEME", []))

        loader = self.jinja_env.loader
        if loader is None:
            raise RuntimeError(
                "Jinjax catalog is not bound to a Jinja2 loader. "
                "Ensure the catalog is initialized within an app context."
            )

        for path in loader.list_templates():
            if not path.endswith(DEFAULT_EXTENSION):
                continue
            jinja_template = loader.load(self.jinja_env, path)
            template_path = jinja_template.filename
            if template_path is None:
                raise RuntimeError(f"Template {path} does not have a filename associated with it.")
            absolute_path = Path(template_path)
            relative_path = Path(path)
            template_name, stripped = strip_app_theme(template_path, app_theme)

            template_name = template_name[: -len(DEFAULT_EXTENSION)]
            template_name = template_name.replace(SLASH, DELIMITER)

            # extract priority
            split_name = list(template_name.rsplit(DELIMITER, 1))
            split_name[-1], priority = self._extract_priority(split_name[-1])
            template_name = DELIMITER.join(split_name)

            if stripped:
                priority += 10

            searchpath.append(SearchPathItem(template_name, absolute_path, relative_path, priority))

        return searchpath

    # component handling: currently Component class is not replaceable, so we need to override the following
    # methods to add global context to the component rendering

    @override
    def _get_from_source(self, *, name: str, prefix: str, source: str) -> Component:
        """Get a component from source code, preserving global context.

        :param name: Component name.
        :param url_prefix: URL prefix for assets.
        :param source: Source code of the component.
        :return: Component instance with global context.
        """
        loaded_component = super()._get_from_source(name=name, prefix=prefix, source=source)
        return cast(
            "Component",  # keep global is a proxy so can cast it to Component
            KeepGlobalContextComponent(
                self,
                loaded_component,
            ),
        )

    @override
    def _get_from_cache(self, *, prefix: str, name: str, file_ext: str) -> Component | None:
        """Get a component from cache, preserving global context.

        :param prefix: Prefix for the component.
        :param name: Component name.
        :param file_ext: File extension for the template.
        :return: Component instance with global context.
        """
        cached_component = super()._get_from_cache(prefix=prefix, name=name, file_ext=file_ext)
        if cached_component is None:
            return None
        return cast(
            "Component",  # keep global is a proxy so can cast it to Component
            KeepGlobalContextComponent(
                self,
                cached_component,
            ),
        )

    @override
    def _get_from_file(self, *, prefix: str, name: str, file_ext: str) -> Component | None:
        """Get a component from a file, preserving global context.

        :param prefix: Prefix for the component.
        :param name: Component name.
        :param file_ext: File extension for the template.
        :return: Component instance with global context.
        """
        loaded_component = super()._get_from_file(prefix=prefix, name=name, file_ext=file_ext)
        if loaded_component is None:
            return None
        return cast(
            "Component",  # keep global is a proxy so can cast it to Component
            KeepGlobalContextComponent(
                self,
                loaded_component,
            ),
        )


class KeepGlobalContextComponent:
    """Wrapper for a component to preserve global context during rendering."""

    def __init__(self, catalogue: OarepoCatalog, component: Component):
        """Wrap a component to preserve global context during rendering.

        :param __catalogue: OarepoCatalog instance.
        :param __component: Component instance to wrap.
        """
        self.__component = component
        self.__catalogue = catalogue

    def filter_args(self, kwargs: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
        """Filter arguments for the component and update template context.

        :param kwargs: Keyword arguments for the component.
        :return: Tuple of (props, extras) after filtering.
        """
        props, extras = self.__component.filter_args(kwargs)
        self.__catalogue.update_template_context(props)
        return props, extras

    def __getattr__(self, item: str) -> Any:
        """Delegate attribute access to the wrapped component.

        :param item: Attribute name.
        :return: Attribute value from the wrapped component.
        """
        return getattr(self.__component, item)


def strip_app_theme(template_name: str, app_theme: list[str]) -> tuple[str, bool]:
    """Strip the theme prefix from a template name if present.

    :param template_name: Name of the template.
    :param app_theme: List of theme names.
    :return: Tuple of (stripped template name, bool indicating if stripped).
    """
    if app_theme:
        for theme in app_theme:
            if template_name.startswith(f"{theme}/"):
                return template_name[len(theme) + 1 :], True
    return template_name, False
