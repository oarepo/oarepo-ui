#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Utilities for working with LESS components."""

from __future__ import annotations

import re
from importlib.metadata import entry_points
from pathlib import Path

from flask import current_app


def enumerate_assets() -> tuple[dict[str, str], list[Path]]:
    """Enumerate asset directories and their generated paths."""
    asset_dirs: list[Path] = []
    aliases: dict[str, str] = {}
    themes = current_app.config["APP_THEME"] or ["semantic-ui"]

    for ep in entry_points(group="invenio_assets.webpack"):
        webpack = ep.load()
        for wp_theme_name, wp_theme in webpack.themes.items():
            if wp_theme_name in themes:
                asset_dirs.append(Path(wp_theme.path))
                aliases.update(wp_theme.aliases)
    return aliases, asset_dirs


# regular expressions for parsing out components
COMPONENT_LIST_RE = re.compile(
    r"""
^
\s*
&        # start of import statement & { import "blah"; }
\s*
{
\s*
(
    @import\s+["'](.*?)["']
    \s*
    ;
)+
\s*
}""",
    re.MULTILINE | re.DOTALL | re.VERBOSE,
)

COMPONENT_RE = re.compile(
    r"""
\s*
@import\s+["'](.*?)["']
\s*
;
\s*
""",
    re.MULTILINE | re.DOTALL | re.VERBOSE,
)
