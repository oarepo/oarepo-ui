#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI Babel component module.

This module provides internationalization support for OARepo UI through
the BabelComponent class, which adds current and default locale and
a list of available locales to the form configuration.
"""

from __future__ import annotations

from typing import Any, override

from flask import current_app
from invenio_i18n.ext import current_i18n

from ..records.config import RecordsUIResourceConfig
from .base import UIResourceComponent


class BabelComponent[T: RecordsUIResourceConfig = RecordsUIResourceConfig](UIResourceComponent[T]):
    """Add i18n locale information to the form configuration.

    Populates current_locale, default_locale, and a list of available locales
    derived from the active i18n configuration to help the UI render language
    selectors and localized inputs.
    """

    @override
    def form_config(self, *, form_config: dict[str, Any], **_kwargs: Any) -> None:
        """Populate form configuration with i18n locale options.

        This collects available locales from current_i18n, sets the current locale,
        default locale, and the list of available locales as select options.

        :param form_config: Form configuration dictionary to be mutated in-place.
        :returns: None
        :raises: None
        """
        conf = current_app.config
        locales: list[dict[str, str]] = []
        for loc in current_i18n.get_locales():
            # Avoid duplicate language entries
            if loc.language in [lang["value"] for lang in locales]:
                continue

            option = {"value": loc.language, "text": loc.get_display_name()}
            locales.append(option)

        form_config.setdefault("current_locale", str(current_i18n.locale))
        form_config.setdefault("default_locale", conf.get("BABEL_DEFAULT_LOCALE", "en"))
        form_config.setdefault("locales", locales)
