# SPDX-FileCopyrightText: 2025-2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Decorator for adding HTTP methods."""

from __future__ import annotations

from typing import TYPE_CHECKING, ParamSpec, TypeVar

if TYPE_CHECKING:
    from collections.abc import Callable, Iterable

P = ParamSpec("P")
R = TypeVar("R")


def allow_method(
    methods: Iterable[str] | None = None,
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Handle allowed HTTP methods to a view function."""
    if methods is None:
        methods = ["GET"]

    def inner(func: Callable[P, R]) -> Callable[P, R]:
        """Attach the configured HTTP methods to the wrapped view function."""
        # the attribute is read back via ``getattr(view, "_http_methods", ...)``
        vars(func)["_http_methods"] = methods
        return func

    return inner
