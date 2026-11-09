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
from typing import TYPE_CHECKING, Any, cast

from flask import g, make_response, redirect, request
from flask_resources import from_conf, resource_requestctx, with_content_negotiation
from flask_resources.errors import MIMETypeNotAccepted
from oarepo_runtime import current_runtime

if TYPE_CHECKING:
    from werkzeug import Response


_negotiate_ui = with_content_negotiation(
    response_handlers=from_conf("response_handlers"),
    default_accept_mimetype=from_conf("default_accept_mimetype"),
)


def negotiate_ui_view[T: Callable](view: T) -> T:
    """Use Flask-Resources negotiation unless the view negotiates against its record."""
    if getattr(view, "_negotiates_record_content", False):
        return view
    return cast("T", _negotiate_ui(view))


def record_content_negotiation[T: Callable](f: T) -> T:
    """Serve HTML or redirect to the API for a visible export of this record."""

    @wraps(f)
    def inner(*args: Any, **kwargs: Any) -> Response:
        record = kwargs["record"]
        data = record.to_dict()
        model = current_runtime.models_by_schema[data["$schema"]]
        offered = ["text/html", *(export.mimetype for export in model.exports if export.is_displayed(g.identity))]
        selected = request.accept_mimetypes.best_match(offered) if "Accept" in request.headers else "text/html"

        if selected is None:
            response = MIMETypeNotAccepted(allowed_mimetypes=offered).get_response()
        elif selected == "text/html":
            resource_requestctx.accept_mimetype = selected
            resource_requestctx.response_handler = resource_requestctx.config.response_handlers.get(selected)
            response = make_response(f(*args, **kwargs))
        else:
            endpoint = "read_draft" if data.get("is_draft", getattr(record, "is_draft", False)) else "read"
            response = redirect(model.api_url(endpoint, pid_value=record.id))

        response.vary.add("Accept")
        if any(export.display_if is not None for export in model.exports):
            # The same Accept header can select different formats for different users.
            response.cache_control.public = False
            response.cache_control.private = True
        return response

    inner._negotiates_record_content = True  # type: ignore[attr-defined]
    return cast("T", inner)
