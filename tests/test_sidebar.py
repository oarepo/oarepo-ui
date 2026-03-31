#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#

from __future__ import annotations

from pathlib import Path

import pytest


@pytest.fixture(scope="module")
def record_service(app, second_record_model):
    """Override record_service to use second_model."""
    from oarepo_runtime import current_runtime

    return current_runtime.models["second_model"].service


@pytest.fixture
def model_sidebar_template(app):
    """Create a model-specific sidebar template."""
    template_dir = Path(app.root_path) / "templates" / "semantic-ui" / "second_model" / "record_detail"
    template_dir.mkdir(parents=True, exist_ok=True)
    template_path = template_dir / "record_sidebar.html"

    template_path.write_text('<div class="model-specific-sidebar">Model Specific Sidebar</div>')

    yield template_path

    if template_path.exists():
        template_path.unlink()


@pytest.fixture
def custom_sidebar_widget_template(app):
    """Create a custom sidebar widget template for config-based test."""
    template_dir = Path(app.root_path) / "templates" / "semantic-ui" / "second_model" / "record_detail" / "side_bar"
    template_dir.mkdir(parents=True, exist_ok=True)
    template_path = template_dir / "custom_widget.html"

    template_path.write_text('<div class="custom-widget">Custom Widget from Config</div>')

    yield "second_model/record_detail/side_bar/custom_widget.html"

    if template_path.exists():
        template_path.unlink()


def test_sidebar_model_specific_template(
    app,
    location,
    logged_client,
    users,
    record_factory,
    extra_entry_points,
    model_sidebar_template,
):
    """Test that model-specific sidebar template takes precedence."""
    creator = users[0]
    published_record = record_factory(creator.identity)

    with logged_client(creator).get(published_record["links"]["self_html"]) as resp:
        assert resp.status_code == 200
        assert b"Model Specific Sidebar" in resp.data


def test_sidebar_default_fallback(app, location, logged_client, users, record_factory, extra_entry_points):
    """Test that default RDM sidebar is used when no model-specific config or template exists."""
    creator = users[0]
    published_record = record_factory(creator.identity)

    with logged_client(creator).get(published_record["links"]["self_html"]) as resp:
        assert resp.status_code == 200
        # The RDM sidebar should be rendered (contains sidebar structure)
        # Verify it's HTML, not JSON
        assert b"<!DOCTYPE html>" in resp.data or b"<html" in resp.data


def test_sidebar_model_specific_config(
    app,
    location,
    logged_client,
    users,
    record_factory,
    extra_entry_points,
    custom_sidebar_widget_template,
    monkeypatch,
):
    """Test that model-specific config (OAREPO_UI_SIDEBAR_TEMPLATES) is used."""
    monkeypatch.setitem(
        app.config,
        "OAREPO_UI_SIDEBAR_TEMPLATES",
        {
            "second_model": [custom_sidebar_widget_template],
        },
    )

    creator = users[0]
    published_record = record_factory(creator.identity)

    with logged_client(creator).get(published_record["links"]["self_html"]) as resp:
        assert resp.status_code == 200
        assert b"Custom Widget from Config" in resp.data
