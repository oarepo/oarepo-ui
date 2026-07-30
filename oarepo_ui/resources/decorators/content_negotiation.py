#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Decorators for content negotiation on records."""

from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import TYPE_CHECKING, Any

from flask import redirect, request
from invenio_base import invenio_url_for
from oarepo_runtime import current_runtime
from werkzeug.http import parse_accept_header

if TYPE_CHECKING:
    from werkzeug import Response


def _prefers_html() -> bool:
    """Check if the request prefers HTML content via Accept header."""
    parsed = parse_accept_header(request.headers.get("accept", "text/html"))
    return bool(parsed.best_match({"text/html", "application/xhtml+xml"}))


def record_content_negotiation[T: Callable](f: T) -> T:
    """Handle content negotiation.

     Handle content negotiation and redirect to appropriate URLs
    based on the "accept" header in the request and the record attributes. This ensures
    that requests expecting a landing page are served directly, while others are redirected
    to specific API endpoints based on the record's schema and state (draft or published).
    """

    @wraps(f)
    def inner(*args: Any, **kwargs: Any) -> Response:
        if _prefers_html():
            return f(*args, **kwargs)

        record = kwargs["record"]
        record_dict = record.to_dict()
        model = current_runtime.models_by_schema[record_dict["$schema"]]
        if getattr(record, "is_draft", False):
            return redirect(model.api_url("read_draft", pid_value=record.id))
        return redirect(model.api_url("read", pid_value=record.id))

    return inner  # type: ignore[return-value]


def vocabulary_content_negotiation[T: Callable](f: T) -> T:
    """Handle content negotiation.

     Handle content negotiation and redirect to appropriate URLs
    based on the "accept" header in the request and the record attributes. This ensures
    that requests expecting a vocabulary entry page are served directly, while others are redirected
    to specific API endpoints based on the vocabulary.
    """

    @wraps(f)
    def inner(*args: Any, **kwargs: Any) -> Response:
        if _prefers_html():
            return f(*args, **kwargs)

        api_url = invenio_url_for("vocabularies.read", type=kwargs["vocabulary_type"], pid_value=kwargs["pid_value"])
        return redirect(api_url)

    return inner  # type: ignore[return-value]
