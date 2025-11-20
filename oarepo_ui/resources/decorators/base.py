#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#

"""Base record views decorators."""

from __future__ import annotations

import logging
import warnings
from collections.abc import Callable, Iterable
from functools import partial, wraps
from typing import TYPE_CHECKING, Any, ParamSpec, TypeVar, cast

from flask import session
from flask_resources import (
    RequestParser,
    from_conf,
)
from flask_resources.config import resolve_from_conf
from flask_security import login_required

if TYPE_CHECKING:
    from flask import Response
    from werkzeug import Response as WerkzeugResponse

    from oarepo_ui.resources import UIResource, UIResourceConfig
    from oarepo_ui.resources.records.resource import RecordsUIResource

P = ParamSpec("P")
R = TypeVar("R")

log = logging.getLogger("oarepo_ui.resources")


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
    s = resolve_from_conf(schema_or_parser, config)  # type: ignore[reportArgumentType]
    if isinstance(s, RequestParser):
        parser = s
        if location is not None:
            warnings.warn("The location is ignored.", stacklevel=1)
    else:
        if location is None:
            raise ValueError("Location must be specified when schema is provided.")
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

            return f(self, *args, **{**request_args, **kwargs})  # type: ignore[no-any-return]

        return view  # type: ignore[return-value]

    return decorator  # type: ignore[return-value]


pass_query_args = partial(_pass_request_args, location="args")
"""Pass query string arguments to the view function."""

pass_route_args = partial(_pass_request_args, location="view_args")
"""Pass route arguments (from path) to the view function."""


def no_cache_response[T: Callable](f: T) -> T:
    """Disable HTTP caching on the wrapped view.

    It ensures that the returned response has the following headers set:
    - ``Cache-Control: no-cache``
    - ``Cache-Control: no-store``
    - ``Cache-Control: must-revalidate``

    Useful for views where responses must never be cached by clients or proxies.
    """

    @wraps(f)
    def inner(*args: Any, **kwargs: Any) -> WerkzeugResponse:
        """Inner function to add signposting link to response headers."""
        response = f(*args, **kwargs)

        response.cache_control.no_cache = True
        response.cache_control.no_store = True
        response.cache_control.must_revalidate = True

        return response

    return inner  # type: ignore[return-value]


def secret_link_or_login_required() -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Require a secret link token or force login for the wrapped view.

    Checks for a token in the session (under key "token"). If the token is missing,
    the user is redirected to login. Otherwise, executes the wrapped view.
    """

    def decorator(f: Callable[P, R]) -> Callable[P, R]:
        @wraps(f)
        def view(*args: P.args, **kwargs: P.kwargs) -> Any:
            self = cast("RecordsUIResource", args[0])
            secret_link_token_arg = "token"  # noqa S105
            session_token = session.get(secret_link_token_arg, None)
            if session_token is None:
                return login_required(f)(self, **kwargs)
            return f(*args, **kwargs)

        return cast("Callable[P, R]", view)

    return decorator
