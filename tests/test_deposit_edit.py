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

from invenio_config.default import ALLOWED_HTML_ATTRS, ALLOWED_HTML_TAGS

from tests.util import _clean_unstable_fields


def test_deposit_edit(app, location, record_service, logged_client, users, draft_factory, extra_entry_points):
    draft = draft_factory(users[0].identity)

    with logged_client(users[0]).get(f"/simple-model/uploads/{draft['id']}") as resp:
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
            "can_delete_draft": True,
            "can_manage": True,
            "can_manage_files": True,
            "can_manage_record_access": True,
        }
        assert mode == "edit"
        assert set(response.keys()) >= expected_keys
        # Example: check a few key fields
        forms_config = response["forms_config"]
        assert forms_config["allowedHtmlTags"] == ALLOWED_HTML_TAGS
        assert forms_config["allowedHtmlAttrs"] == ALLOWED_HTML_ATTRS
        assert forms_config["current_locale"] == "en"
        assert forms_config["allowEmptyFiles"] is True
        assert forms_config["updateUrl"].endswith(f"/api/simple-model/{draft['id']}/draft")

        record = response["record"]
        assert record["id"] == draft["id"]
        assert record["status"] == "draft"
        assert "ui" in record
        assert "links" in record

        ui = response["record"].pop("ui")
        assert "created_date_l10n_full" in ui
        assert "created_date_l10n_long" in ui
        assert "created_date_l10n_medium" in ui
        assert "created_date_l10n_short" in ui
        assert "updated_date_l10n_full" in ui
        assert "updated_date_l10n_long" in ui
        assert "updated_date_l10n_medium" in ui
        assert "updated_date_l10n_short" in ui

        files = response.pop("files")
        assert files is not None
        assert files["enabled"] == False
        assert isinstance(response["permissions"], dict)

        for key, value in expected_permissions.items():
            assert response["permissions"].get(key) == value
