#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#

"""Decorator for adding HTTP methods."""

from __future__ import annotations

from typing import TYPE_CHECKING, ParamSpec, TypeVar

if TYPE_CHECKING:
    from collections.abc import Callable, Iterable

P = ParamSpec("P")
R = TypeVar("R")


def allow_method(methods: Iterable[str] | None = None) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Handle allowed HTTP methods to a view function."""
    if methods is None:
        methods = ["GET"]

    def inner(func: Callable[P, R]) -> Callable[P, R]:
        """Attach the configured HTTP methods to the wrapped view function."""
        func._http_methods = methods  # type: ignore[attr-defined]  # noqa: SLF001
        return func

    return inner
