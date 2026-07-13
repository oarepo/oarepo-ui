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

from flask import make_response, render_template
from oarepo_runtime.api import ExportEngine
from oarepo_runtime.proxies import current_runtime
from oarepo_runtime.resources.signposting import create_linkset

from ..utils import get_api_record_from_response

if TYPE_CHECKING:
    from flask import Response

DATACITE_MIMETYPE = "application/vnd.datacite.datacite+json"

DATACITE_EXPORT_DOCS_URL = "https://nrp-cz.github.io/docs/customize/model_backend/exports_and_imports#datacite-export"

MISSING_DATACITE_EXPORT_TEMPLATE = "oarepo_ui/missing_datacite_export.html"


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
        # Signposting relies on a DataCite export, which every signposted model must
        # provide. Render a themed error page before the view runs (rendering after it
        # breaks the page's styling) when the model has no DataCite export.
        record = kwargs.get("record") or kwargs.get("draft")
        if record is not None:
            record_dict = record.to_dict()
            model = current_runtime.models_by_schema.get(record_dict["$schema"])
            if model is None or model.get_export_by_mimetype(DATACITE_MIMETYPE) is None:
                return make_response(
                    render_template(MISSING_DATACITE_EXPORT_TEMPLATE, docs_url=DATACITE_EXPORT_DOCS_URL),
                    404,
                )

        response = f(*args, **kwargs)
        if response.status_code != 200:  # noqa: PLR2004 official 200 http code
            return response

        api_record = get_api_record_from_response(response)
        if not api_record:
            return response
        record_dict = api_record.to_dict()
        record_linkset = create_linkset(
            ExportEngine.export(record_dict=record_dict, export_mimetype=DATACITE_MIMETYPE),
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

    return inner  # type: ignore[return-value]
