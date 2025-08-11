#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI signposting module.

This module provides signposting functionality for OARepo UI responses,
implementing decorators to add signposting headers to HTTP responses
for improved machine-readable metadata discovery.
"""

from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import TYPE_CHECKING, Any

from .utils import get_api_record_from_response

if TYPE_CHECKING:
    from flask import Response


def response_header_signposting[T: Callable](f: T) -> T:
    """Add signposting link to view's reponse headers.

    :param headers: response headers
    :type headers: dict
    :return: updated response headers
    :rtype: dict
    """

    @wraps(f)
    def inner(*args: Any, **kwargs: Any) -> Response:
        """Inner function to add signposting link to response headers."""
        response = f(*args, **kwargs)
        if response.status_code != 200:  # noqa: PLR2004 official 200 http code
            return response

        api_record = get_api_record_from_response(response)
        if not api_record:
            return response

        signposting_link = api_record.links["self"]
        response.headers.update(
            {
                "Link": f'<{signposting_link}> ; rel="linkset" ; type="application/linkset+json"',
            }
        )

        return response

    return inner  # type: ignore[return-value]
