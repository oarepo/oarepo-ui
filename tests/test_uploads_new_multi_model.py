#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Tests for the generic /uploads/new route with multiple models."""

from __future__ import annotations

import pytest


@pytest.fixture(scope="module")
def extra_entry_points(record_model, second_record_model):
    """Override extra_entry_points to load both simple_model and second_model."""
    return {
        "invenio_i18n.translations": ["1000-test = tests"],
        "invenio_base.blueprints": [
            "ui_simple_model = tests.simple_model:create_blueprint",
            "ui_second_model = tests.second_model:create_blueprint",
        ],
        "invenio_base.finalize_app": ["ui_simple_model = tests.simple_model:finalize_app"],
    }


def test_uploads_new_multiple_models_renders_template(app, logged_client, users, extra_entry_points):
    """Test that /uploads/new renders selection page when multiple models exist."""
    client = logged_client(users[0])

    with client.get("/uploads/new") as resp:
        # Should render a template, not redirect
        assert resp.status_code == 200
        # Check that the selection page contains expected content
        assert b"Select record type" in resp.data or b"select" in resp.data.lower()


def test_uploads_new_multiple_models_with_community(app, logged_client, users, extra_entry_points):
    """Test that /uploads/new passes community_slug to template when multiple models exist."""
    client = logged_client(users[0])

    with client.get("/uploads/new?community=test-community") as resp:
        assert resp.status_code == 200
        # Community slug should be included in the model card links
        assert b"community=test-community" in resp.data
