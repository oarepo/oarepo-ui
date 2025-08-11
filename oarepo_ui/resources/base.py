#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Base UI resource configuration and implementation classes."""

from __future__ import annotations

import inspect
import logging
import warnings
from collections.abc import Callable, Iterable, Mapping
from functools import partial, wraps
from pathlib import Path
from typing import TYPE_CHECKING, Any, Self, override

from flask_resources import (
    RequestParser,
    Resource,
    from_conf,
)
from flask_resources.config import resolve_from_conf
from flask_resources.parsers import MultiDictSchema
from marshmallow import Schema

if TYPE_CHECKING:
    from collections.abc import Iterator, Mapping

    from flask import Blueprint, Response
    from flask.typing import ErrorHandlerCallable
    from marshmallow import Schema

    from .components import UIResourceComponent

log = logging.getLogger("oarepo_ui.resources")


class UIResourceConfig:
    """Base configuration class for UI resources."""

    blueprint_name: str
    """Name of the blueprint for the resource, used for URL routing."""

    url_prefix: str
    """The URL prefix for the blueprint (all URL rules will be prefixed with this value)"""

    components: tuple[type[UIResourceComponent[Self]], ...] = ()
    """Components used in the UI, can be a dictionary or a callable."""

    template_folder: str | None = None
    """Path to the template folder, can be relative or absolute."""

    def get_template_folder(self) -> str | None:
        """Return the absolute path to the template folder."""
        if not self.template_folder:
            return None

        tf = Path(self.template_folder)
        if not tf.is_absolute():
            tf = Path(inspect.getfile(type(self))).parent.absolute().joinpath(tf).absolute()
        return str(tf)

    response_handlers: Mapping[str, Any] = {"text/html": None, "application/json": None}
    default_accept_mimetype = "text/html"

    error_handlers: Mapping[type[Exception], str | ErrorHandlerCallable] = {}

    # Request parsing
    request_read_args: type[Schema] = MultiDictSchema
    request_view_args: type[Schema] = MultiDictSchema


def _resolve_parser(
    schema_or_parser: Any,
    config: UIResourceConfig,
    location: str | None,
    options: dict[str, Any],
) -> RequestParser:
    """Resolve and return a RequestParser instance.

    :param schema_or_parser: Schema or parser instance or config key.
    :param config: Resource config object.
    :param location: Location for parsing (ignored if parser is already a RequestParser).
    :param options: Additional options for parser construction.
    :return: RequestParser instance.
    :raises: May raise warnings if location is ignored.
    """
    s = resolve_from_conf(schema_or_parser, config)
    if isinstance(s, RequestParser):
        parser = s
        if location is not None:
            warnings.warn("The location is ignored.", stacklevel=1)
    else:
        parser = RequestParser(s, location, **options)
    return parser


def _pass_request_args[T: Callable](
    *field_configs: str,
    location: str | None = None,
    exclude: Iterable[str] = (),
    **options: Any,
) -> Callable[[T], T]:
    """Pass request arguments from specified field configs to the view function.

    :param field_configs: Field config names or a function.
    :param location: Location for parsing (e.g., 'args', 'view_args').
    :param exclude: Iterable of argument names to exclude.
    :param options: Additional options for parser construction.
    :return: Decorator that injects parsed request arguments into the view.
    """

    def decorator(f: T) -> T:
        @wraps(f)
        def view(self: UIResource, *args: Any, **kwargs: Any) -> Response:
            """View function that injects parsed request arguments.

            :param self: Instance of the resource class.
            :param args: Positional arguments passed to the view.
            :param kwargs: Keyword arguments passed to the view.
            :return: Result of the view function with injected request arguments.
            """
            request_args = {}
            for field in field_configs:
                schema = from_conf(f"request_{field}_args")
                parser = _resolve_parser(schema, self.config, location, options)
                parsed_args = {k: v for k, v in parser.parse().items() if k not in exclude}
                request_args.update(parsed_args)

            return f(self, *args, **request_args, **kwargs)  # type: ignore[no-any-return]

        return view  # type: ignore[return-value]

    return decorator  # type: ignore[return-value]


pass_query_args = partial(_pass_request_args, location="args")
"""Pass query string arguments to the view function."""

pass_route_args = partial(_pass_request_args, location="view_args")
"""Pass route arguments (from path) to the view function."""


class UIComponentsResource[T: UIResourceConfig](Resource):
    """Base class for UI resources that provides component management."""

    #
    # Pluggable components
    #
    config: T

    @property
    def components(self) -> Iterator[UIResourceComponent[T]]:
        """Return initialized service components."""
        return (c(self) for c in self.config.components or [])

    def run_components(self, action: str, *args: Any, **kwargs: Any) -> None:
        """Run components for a given action."""
        for component in self.components:
            if hasattr(component, action):
                getattr(component, action)(*args, **kwargs)


class UIResource[T: UIResourceConfig = UIResourceConfig](UIComponentsResource[T]):
    """A generic UI resource."""

    @override
    def as_blueprint(self, **options: Any) -> Blueprint:
        if "template_folder" not in options:
            template_folder = self.config.get_template_folder()
            if template_folder:
                options["template_folder"] = template_folder
        blueprint: Blueprint = super().as_blueprint(**options)
        blueprint.app_context_processor(lambda: self.get_jinja_context())

        for (
            exception_class,
            handler_callable_or_attribute_name,
        ) in self.config.error_handlers.items():
            if isinstance(handler_callable_or_attribute_name, str):
                handler = getattr(self, handler_callable_or_attribute_name)
            else:
                handler = handler_callable_or_attribute_name
            blueprint.register_error_handler(exception_class, handler)

        return blueprint

    def get_jinja_context(self) -> dict[str, Any]:
        """Get jinja context from components."""
        ret: dict[str, Any] = {}
        self.run_components("fill_jinja_context", context=ret)
        return ret
