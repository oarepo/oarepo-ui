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
from collections.abc import Mapping
from pathlib import Path
from typing import TYPE_CHECKING, Any, Self, override

from flask_resources import (
    Resource,
)
from flask_resources.config import resolve_from_conf
from flask_resources.context import ResourceRequestCtx
from flask_resources.parsers import MultiDictSchema
from marshmallow import Schema

if TYPE_CHECKING:
    from collections.abc import Iterable, Iterator, Mapping

    from flask import Blueprint
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

    response_handlers: Mapping[str, Any] = {
        "text/html": None,
        "application/json": None,
        "application/linkset": None,
    }
    default_accept_mimetype = "text/html"

    error_handlers: Mapping[type[Exception], str | ErrorHandlerCallable] = {}

    # Request parsing
    request_read_args: type[Schema] = MultiDictSchema
    request_view_args: type[Schema] = MultiDictSchema


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
        blueprint.app_context_processor(self.get_jinja_context)

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


# ruff: noqa: PLR0913
def multiple_methods_route(
    methods: Iterable[str],
    rule: str,
    view_meth: Any,
    endpoint: str | None = None,
    rule_options: Mapping[str, Any] | None = None,
    apply_decorators: bool = True,
) -> dict:
    """Create a route.

    Use this method in ``create_url_rules()`` to build your list of rules.

    The ``view_method`` parameter should be a bound method (e.g.
    ``self.myview``).

    :param methods: The HTTP methods for this URL rule.
    :param rule: A URL rule.
    :param view_meth: The view method (a bound method) for this URL rule.
    :param endpoint: The name of the endpoint. By default the name is taken
        from the method name.
    :param rule_options: A dictionary of extra options passed to
        ``Blueprint.add_url_rule``.
    :param apply_decorators: Apply the decorators defined by the resource.
        Defaults to ``True``. This allows you to selective disable
        decorators which are normally applied to all view methods.
    """
    view_name = view_meth.__name__
    config = view_meth.__self__.config
    decorators = view_meth.__self__.decorators

    if apply_decorators:
        # reversed so order is the same as when applied directly to method
        for decorator in reversed(decorators):
            view_meth = decorator(view_meth)

    def view(*args: Any, **kwargs: Any) -> Any:
        _, _ = args, kwargs
        with ResourceRequestCtx(config):
            # args and kwargs are ignored on purpose - use a request parser
            # to retrieve the validated values.
            return view_meth()

    view.__name__ = view_name

    return {
        "rule": resolve_from_conf(rule, config),
        "methods": methods,
        "view_func": view,
        "endpoint": endpoint,
        **(rule_options or {}),
    }
