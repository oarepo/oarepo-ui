#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI component injecting allowed HTML tags and attributes into form configuration.

This module exposes a component that enriches the UI form configuration with
whitelisted HTML tags and attributes used by the frontend sanitizers.
"""

from __future__ import annotations

from typing import Any, override

from flask import current_app
from invenio_config.default import ALLOWED_HTML_ATTRS, ALLOWED_HTML_TAGS

from ..records.config import RecordsUIResourceConfig
from .base import UIResourceComponent


class AllowedHtmlTagsComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Component that injects allowed HTML tags and attributes into form configuration.

    Reads values from Flask configuration (ALLOWED_HTML_TAGS, ALLOWED_HTML_ATTRS) and
    falls back to invenio-config defaults when not provided.
    """

    @override
    def form_config(self, *, form_config: dict[str, Any], **_kwargs: Any) -> None:
        """Populate form configuration with allowed HTML tags and attributes.

        :param form_config: Form configuration dictionary to be mutated in-place.
        """
        form_config["allowedHtmlTags"] = current_app.config.get("ALLOWED_HTML_TAGS", ALLOWED_HTML_TAGS)

        form_config["allowedHtmlAttrs"] = current_app.config.get("ALLOWED_HTML_ATTRS", ALLOWED_HTML_ATTRS)
