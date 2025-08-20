#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Commands for working with LESS components."""

from __future__ import annotations

import json
import re
from importlib.metadata import entry_points
from pathlib import Path

import click
from flask import current_app
from flask.cli import with_appcontext


@click.group(name="less")
def less() -> None:
    """Commands for working with LESS components."""


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


@less.command(name="components")
@click.argument("fname", type=click.Path(exists=False, dir_okay=False))
@with_appcontext
def list_components(fname: str) -> None:
    """List all LESS components into the specified json file."""
    aliases, asset_dirs = enumerate_assets()
    less_component_files: list[Path] = []

    for asset_dir in asset_dirs:
        less_dir = asset_dir / "less"
        if less_dir.exists():
            less_component_files.extend(f for f in less_dir.glob("**/custom-components.less"))

    components = set()
    for cmp_file in less_component_files:
        for component_list in COMPONENT_LIST_RE.findall(cmp_file.read_text()):
            for s in COMPONENT_RE.findall(component_list[0]):
                components.add(Path(s).stem)
    data = {"components": sorted(components)}

    if fname == "-":
        click.echo(json.dumps(data, indent=4, ensure_ascii=False))
    else:
        Path(fname).write_text(json.dumps(data, indent=4, ensure_ascii=False))


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
