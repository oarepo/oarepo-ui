#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
"""Tests for the generic /uploads/new route in oarepo_ui.views (single model)."""

from __future__ import annotations


def test_uploads_new_requires_login(app, client, extra_entry_points, record_model):
    """Test that /uploads/new requires authentication."""
    with client.get("/uploads/new") as resp:
        # Should redirect to login page
        assert resp.status_code == 302
        assert "login" in resp.location.lower()


def test_uploads_new_single_model_redirect(app, logged_client, users, extra_entry_points, record_model, monkeypatch):
    """Test that /uploads/new redirects to model-specific page when single model exists."""
    client = logged_client(users[0])
    # Override OAREPO_MODELS to only include the simple_model to simulate single model scenario
    monkeypatch.setitem(app.config, "OAREPO_MODELS", {"simple_model": app.config["OAREPO_MODELS"]["simple_model"]})
    with client.get("/uploads/new") as resp:
        assert resp.status_code == 302
        assert resp.location.endswith("/simple-model/uploads/new")


def test_uploads_new_single_model_with_community(
    app, logged_client, users, extra_entry_points, record_model, monkeypatch
):
    """Test that /uploads/new preserves community parameter in redirect."""
    client = logged_client(users[0])
    # Override OAREPO_MODELS to only include the simple_model to simulate single model scenario
    monkeypatch.setitem(app.config, "OAREPO_MODELS", {"simple_model": app.config["OAREPO_MODELS"]["simple_model"]})

    with client.get("/uploads/new?community=test-community") as resp:
        assert resp.status_code == 302
        assert "/simple-model/uploads/new" in resp.location
        assert "community=test-community" in resp.location
