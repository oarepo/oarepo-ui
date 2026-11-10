# SPDX-FileCopyrightText: 2024-2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""OARepo UI signposting module.

This module provides signposting functionality for OARepo UI responses,
implementing decorators to add signposting headers to HTTP responses
for improved machine-readable metadata discovery.
"""

from __future__ import annotations

from functools import wraps
from http import HTTPStatus
from typing import TYPE_CHECKING

from oarepo_runtime.api import ExportEngine
from oarepo_runtime.resources.signposting import create_linkset
from werkzeug import Response

from ..utils import get_api_record_from_response

if TYPE_CHECKING:
    from collections.abc import Callable


def response_header_signposting[**P, R: Response](f: Callable[P, R]) -> Callable[P, R]:
    """Add signposting link to view's reponse headers.

    :param headers: response headers
    :type headers: dict
    :return: updated response headers
    :rtype: dict
    """

    @wraps(f)
    def inner(*args: P.args, **kwargs: P.kwargs) -> R:
        """Inner function to add signposting link to response headers."""
        response = f(*args, **kwargs)
        if response.status_code != HTTPStatus.OK:
            return response

        api_record = get_api_record_from_response(response)
        if not api_record:
            return response
        record_dict = api_record.to_dict()
        record_linkset = create_linkset(
            ExportEngine.export(record_dict=record_dict, export_mimetype="application/vnd.datacite.datacite+json"),
            record_dict,
            include_reverse_relations=False,
        )
        if record_linkset:
            response.headers.update(
                {
                    "Link": record_linkset,
                }
            )

        return response

    return inner
