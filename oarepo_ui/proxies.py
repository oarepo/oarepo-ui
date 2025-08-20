#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""OARepo UI proxies module.

This module provides Flask local proxies for accessing OARepo UI state,
configuration overrides, and webpack manifest functionality throughout
the application lifecycle.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from flask import current_app
from werkzeug.local import LocalProxy

if TYPE_CHECKING:
    from oarepo_ui.ui.components import UIComponentOverride

    from .ext import OARepoUIState

    current_oarepo_ui: OARepoUIState
    current_ui_overrides: set[UIComponentOverride]

current_oarepo_ui = LocalProxy(lambda: current_app.extensions["oarepo_ui"])  # type: ignore[assignment]
"""Proxy to the oarepo_ui state."""

current_ui_overrides = LocalProxy(lambda: current_app.extensions["oarepo_ui"].ui_overrides)  # type: ignore[assignment]
"""Proxy to get the current ui_overrides."""

current_optional_manifest = LocalProxy(lambda: current_oarepo_ui.optional_manifest)
"""Proxy to current optional webpack manifest."""
