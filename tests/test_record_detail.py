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


def test_record_detail(app, location, logged_client, users, record_factory, extra_entry_points):
    creator = users[0]
    published_record = record_factory(creator.identity)
    assert "self_html" in published_record["links"]
    url = published_record["links"]["self_html"].split("/", 3)[-1]
    with logged_client(creator).get(f"/{url}") as resp:
        assert resp.status_code == 200
        response = json.loads(resp.text)
        expected_top_keys = {
            "record",
            "record_ui",
            "files",
            "media_files",
            "permissions",
            "is_preview",
            "include_deleted",
            "is_draft",
            "community",
            "community_ui",
            "user_avatar",
            "record_owner_id",
        }
        assert expected_top_keys.issubset(response.keys())

        record_ui = response["record_ui"]
        assert isinstance(record_ui, dict)
        assert "ui" in record_ui

        ui = record_ui["ui"]
        for field in (
            "created_date_l10n_full",
            "created_date_l10n_long",
            "created_date_l10n_medium",
            "created_date_l10n_short",
            "updated_date_l10n_full",
            "updated_date_l10n_long",
            "updated_date_l10n_medium",
            "updated_date_l10n_short",
        ):
            assert field in ui

        files = response["files"]
        assert isinstance(files, dict)
        assert files["enabled"] is False

        perms = response["permissions"]
        assert isinstance(perms, dict)
        assert perms.get("can_manage") is True

        assert response["is_preview"] is False
        assert response["include_deleted"] is False
        assert response["is_draft"] is False

        assert "community" in response

        assert response["user_avatar"].endswith(f"/api/users/{creator.id}/avatar.svg")
        assert response["record_owner_id"] == creator.id
