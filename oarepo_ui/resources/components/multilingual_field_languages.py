#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI component injecting allowed languages that can be selected in the language field of multilingual fields.

This module exposes a component that enriches the UI form configuration with
allowed languages that can be selected in the language field of multilingual fields.
"""

from __future__ import annotations

from typing import Any, override

from flask import current_app

from ..records.config import RecordsUIResourceConfig
from .base import UIResourceComponent


class MultilingualFieldLanguagesComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Component that injects allowed languages that can be selected in the language field of multilingual fields.

    Reads values from Flask configuration (OAREPO_UI_MULTILINGUAL_FIELD_LANGUAGES) and
    falls back to oarepo-ui defaults when not provided.
    """

    @override
    def form_config(
        self,
        *,
        form_config: dict[str, Any],
        **_kwargs: Any,
    ) -> None:
        """Populate form configuration with languages that can be selected in the language field of multilingual fields.

        :param form_config: Form configuration dictionary to be mutated
            in-place.
        """
        form_config["multilingualFieldLanguages"] = current_app.config["OAREPO_UI_MULTILINGUAL_FIELD_LANGUAGES"]
