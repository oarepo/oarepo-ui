# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""OARepo UI proxies module.

This module provides Flask local proxies for accessing OARepo UI state,
configuration overrides, and webpack manifest functionality throughout
the application lifecycle.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, cast

from flask import current_app
from werkzeug.local import LocalProxy

if TYPE_CHECKING:
    from collections.abc import Callable

    from markupsafe import Markup

    from oarepo_ui.overrides.components import UIComponentOverride

    from .ext import OARepoUIState

current_oarepo_ui = cast(
    "OARepoUIState",
    LocalProxy(lambda: current_app.extensions["oarepo_ui"]),
)
"""Proxy to the oarepo_ui state."""

current_ui_overrides = cast(
    "set[UIComponentOverride]",
    LocalProxy(lambda: current_app.extensions["oarepo_ui"].ui_overrides),
)
"""Proxy to get the current ui_overrides."""

current_optional_manifest = cast(
    "Callable[[str], str | Markup]",
    LocalProxy(lambda: current_oarepo_ui.optional_manifest),
)
"""Proxy to current optional webpack manifest."""
