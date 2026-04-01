#
# Copyright (c) 2026 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Fake RDM views for testing."""

from __future__ import annotations

from typing import Any, cast

from flask import Blueprint, Flask


def create_records_blueprint(app: Flask) -> Blueprint:
    """Create the UI blueprint for the RDM records."""
    blueprint = Blueprint("invenio_app_rdm_records", __name__)
    routes: dict[str, Any] = cast("dict[str, Any]", app.config.get("APP_RDM_ROUTES"))

    @blueprint.route(routes["record_detail"])
    def record_detail(*args: Any, **kwargs: Any) -> str:
        return ""

    @blueprint.route(routes["deposit_edit"])
    def deposit_edit(*args: Any, **kwargs: Any) -> str:
        return ""

    @blueprint.route(routes["record_export"])
    def record_export(*args: Any, **kwargs: Any) -> str:
        return ""

    @blueprint.route(routes["record_file_preview"])
    def record_file_preview(*args: Any, **kwargs: Any) -> str:
        return ""

    @blueprint.route(routes["record_file_download"])
    def record_file_download(*args: Any, **kwargs: Any) -> str:
        return ""

    @blueprint.route(routes["record_thumbnail"])
    def record_thumbnail(*args: Any, **kwargs: Any) -> str:
        return ""

    @blueprint.route(routes["record_media_file_download"])
    def record_media_file_download(*args: Any, **kwargs: Any) -> str:
        return ""

    @blueprint.route(routes["record_latest"])
    def record_latest(*args: Any, **kwargs: Any) -> str:
        return ""

    return blueprint
