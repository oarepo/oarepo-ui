#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Unit tests for conditional export formats in the record detail sidebar."""

from __future__ import annotations

import html
import json
import re
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import jinja2
import pytest
from flask_principal import Identity
from flask_resources.serializers import BaseSerializer
from oarepo_runtime.api import Export

import oarepo_ui

TEMPLATE_NAME = "oarepo_ui/record_detail/side_bar/export.html"


class _Serializer(BaseSerializer):
    """Placeholder for the serializer, the sidebar template never uses it."""

    def serialize_object(self, obj: Any) -> Any:
        """Return the object unchanged."""
        return obj


def _exporter(code: str, *, display: bool = True, display_if: Any = None, name: str | None = None) -> Export:
    """Build an export format the sidebar can render."""
    return Export(
        code=code,
        name=name or code.upper(),
        mimetype="application/json",
        serializer=_Serializer(),
        display=display,
        display_if=display_if,
    )


def _render(exports: list[Export], identity: Identity | None) -> list[str]:
    """Render the sidebar template and return the export codes it advertises."""
    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(str(Path(oarepo_ui.__file__).parent / "templates")),
        autoescape=True,
    )
    env.globals["_"] = lambda value: value
    model = SimpleNamespace(
        exports=exports,
        ui_url=lambda **kwargs: f"/records/1/export/{kwargs['export_format']}",
    )
    page = env.get_template(TEMPLATE_NAME).render(
        model=model,
        record_ui={"id": "1"},
        is_preview=False,
        # flask-principal sets g.identity on every request, the template relies on it
        g=SimpleNamespace(identity=identity),
    )
    (formats_json,) = re.findall(r"data-formats='([^']*)'", page)
    return [format_["export_url"].rsplit("/", maxsplit=1)[-1] for format_ in json.loads(html.unescape(formats_json))]


@pytest.mark.parametrize(
    ("display", "display_if", "expected_codes"),
    [
        (True, None, ["conditional", "json"]),
        (False, None, ["json"]),
        (True, lambda identity: identity is not None, ["conditional", "json"]),
        (True, lambda _identity: False, ["json"]),
        # display=False must win even when the condition holds
        (False, lambda _identity: True, ["json"]),
    ],
)
def test_export_displayed_for_identity(display, display_if, expected_codes):
    """The sidebar must honour both `display` and the per-request `display_if` condition.

    `display_if` is evaluated with the request identity, so exports restricted to a
    permission (e.g. "can manage") disappear for anonymous users instead of showing a
    download link that leads to a 403.
    """
    exports = [
        _exporter("json", display=True),
        _exporter("conditional", display=display, display_if=display_if),
    ]

    assert _render(exports, Identity("1")) == expected_codes


def test_export_displayed_unauthorized_identity():
    """Anonymous users must not see exports whose condition needs an identity."""
    exports = [_exporter("conditional", display_if=lambda identity: identity is not None)]

    assert _render(exports, None) == []


def test_exports_sorted_by_name():
    """The sidebar lists the exports alphabetically by name, ignoring case, not in registration order."""
    exports = [
        _exporter("rocrate", name="RO-Crate"),
        _exporter("bibtex", name="BibTeX"),
        _exporter("ccmm", name="ccmm export"),
        _exporter("datacite", name="DataCite XML"),
    ]

    assert _render(exports, Identity("1")) == ["bibtex", "ccmm", "datacite", "rocrate"]
