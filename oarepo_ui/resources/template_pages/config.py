# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

"""Template page UI endpoint config."""

from __future__ import annotations

from typing import TYPE_CHECKING

from ..base import UIResourceConfig

if TYPE_CHECKING:
    from collections.abc import Mapping


class TemplatePageUIResourceConfig(UIResourceConfig):
    """Configuration for the template page UI resource."""

    pages: Mapping[str, str] = {}
    """
       Templates used for rendering the UI.
       The key in the dictionary is URL path (relative to url_prefix),
       value is a jinjax macro that renders the UI
   """
