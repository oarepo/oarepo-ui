from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import TYPE_CHECKING, Any

from flask import request, redirect
from oarepo_runtime import current_runtime
from werkzeug.http import parse_accept_header

if TYPE_CHECKING:
    from werkzeug import Response


def record_content_negotiation[T: Callable](f: T) -> T:
    @wraps(f)
    def inner(*args: Any, **kwargs: Any) -> Response:
        """Inner function to add signposting link to response headers."""
        response = f(*args, **kwargs)

        record = kwargs["record"]
        parsed_accept_header = parse_accept_header(request.headers.get("accept", "text/html"))
        landing_page_accept_header_types = {"text/html", "application/xhtml+xml"}
        if parsed_accept_header.best_match(landing_page_accept_header_types):
            return f(*args, **kwargs)
        record_dict = record.to_dict()
        model = current_runtime.models_by_schema[record_dict["$schema"]]
        if getattr(record, "is_draft", False):
            redirect(model.api_url("read_draft", pid_value=record.id))
        return redirect(model.api_url("read", pid_value=record.id))

        return response

    return inner  # type: ignore[return-value]
