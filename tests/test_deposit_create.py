#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

import json

from tests.util import _clean_unstable_fields


def test_deposit_create(app, logged_client, users, extra_entry_points):
    with logged_client(users[0]).get("/simple-model/uploads/new") as resp:
        assert resp.status_code == 200
        response = json.loads(resp.text)

        mode = response.pop("mode", None)
        _clean_unstable_fields(response)

        expected_keys = {
            "theme",
            "forms_config",
            "searchbar_config",
            "record",
            "community",
            "community_ui",
            "community_use_jinja_header",
            "files",
            "preselectedCommunity",
            "files_locked",
            "extra_context",
            "ui_links",
            "permissions",
            "webpack_entry",
        }

        expected_permissions = {
            "can_delete_draft": True,
            "can_manage": True,
            "can_manage_files": True,
            "can_manage_record_access": True,
        }

        assert mode == "create"
        assert set(response.keys()) >= expected_keys
        # Example: check a few key fields
        assert response["forms_config"]["allowEmptyFiles"] is True
        assert response["forms_config"]["createUrl"] == "https://127.0.0.1:5000/api/simple-model"
        assert response["record"]["status"] == "draft"
        assert response["files"]["entries"] == []
        assert isinstance(response["permissions"], dict)
        for key, value in expected_permissions.items():
            assert response["permissions"].get(key) == value, (
                f"permission {key} mismatch: expected {value}, got {response['permissions'].get(key)}"
            )


def test_deposit_create_without_community(app, logged_client, users, extra_entry_points):
    """Test that community and community_ui are None when no community query param is present."""
    with logged_client(users[0]).get("/simple-model/uploads/new") as resp:
        assert resp.status_code == 200
        response = json.loads(resp.text)

        assert response["community"] is None
        assert response["community_ui"] is None
        assert response["preselectedCommunity"] is None


def test_deposit_create_with_community(app, logged_client, users, extra_entry_points, community):
    """Test that preselectedCommunity is set when community query param is present."""
    community_slug = community.slug
    with logged_client(users[0]).get(f"/simple-model/uploads/new?community={community_slug}") as resp:
        assert resp.status_code == 200
        response = json.loads(resp.text)

        # Check that community data is present
        assert response["community"] is not None
        assert response["community_ui"] is not None
        assert response["preselectedCommunity"] is not None

        # Check that preselectedCommunity matches community_ui
        assert response["preselectedCommunity"] == response["community_ui"]

        # Check community metadata
        assert response["community_ui"]["slug"] == community_slug
        assert "title" in response["community_ui"]["metadata"]


def test_deposit_create_with_nonexistent_community(app, logged_client, users, extra_entry_points):
    """Test that community is None when community slug does not exist."""
    with logged_client(users[0]).get("/simple-model/uploads/new?community=nonexistent-community") as resp:
        assert resp.status_code == 200
        response = json.loads(resp.text)

        # Community should be None since it doesn't exist
        assert response["community"] is None
        assert response["community_ui"] is None
        assert response["preselectedCommunity"] is None
