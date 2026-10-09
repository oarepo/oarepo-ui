# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Decorators for content negotiation on records."""

from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import TYPE_CHECKING, Any

from flask import redirect, request
from oarepo_runtime import current_runtime
from werkzeug.http import parse_accept_header

if TYPE_CHECKING:
    from werkzeug import Response


def record_content_negotiation[T: Callable](f: T) -> T:
    """Handle content negotiation.

     Handle content negotiation and redirect to appropriate URLs
    based on the "accept" header in the request and the record attributes. This ensures
    that requests expecting a landing page are served directly, while others are redirected
    to specific API endpoints based on the record's schema and state (draft or published).
    """

    @wraps(f)
    def inner(*args: Any, **kwargs: Any) -> Response:
        record = kwargs["record"]
        parsed_accept_header = parse_accept_header(request.headers.get("accept", "text/html"))
        landing_page_accept_header_types = {"text/html", "application/xhtml+xml"}
        if parsed_accept_header.best_match(landing_page_accept_header_types):
            return f(*args, **kwargs)
        record_dict = record.to_dict()
        model = current_runtime.models_by_schema[record_dict["$schema"]]
        if getattr(record, "is_draft", False):
            return redirect(model.api_url("read_draft", pid_value=record.id))
        return redirect(model.api_url("read", pid_value=record.id))

    return inner  # ty: ignore[invalid-return-type]
