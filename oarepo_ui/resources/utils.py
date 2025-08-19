#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Utility functions for handling API records in Flask responses."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from invenio_records_resources.services.records.results import RecordItem
    from werkzeug import Response


def set_api_record_to_response(response: Response, api_record: RecordItem) -> Response:
    """Set the API record to the response object."""
    response._api_record = api_record  # type: ignore[attr-defined] # noqa
    return response


def get_api_record_from_response(response: Response) -> RecordItem | None:
    """Get the API record from the response object."""
    return getattr(response, "_api_record", None)
