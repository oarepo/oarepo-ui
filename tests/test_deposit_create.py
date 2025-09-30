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
        }

        expected_permissions = {
            "can_delete_draft": False,
            "can_manage": False,
            "can_manage_files": True,
            "can_manage_record_access": True,
        }

        assert mode == "create"
        assert set(response.keys()) >= expected_keys
        # Example: check a few key fields
        assert response["forms_config"]["allowEmptyFiles"] is True
        assert response["forms_config"]["createUrl"] == "/simple-model/uploads/new"
        assert response["record"]["status"] == "draft"
        assert response["files"]["entries"] == []
        assert isinstance(response["permissions"], dict)

        for key, value in expected_permissions.items():
            assert response["permissions"].get(key) == value
