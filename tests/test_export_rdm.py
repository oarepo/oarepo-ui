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


def test_export_ui_json(
    app,
    location,
    logged_client,
    users,
    record_with_files_factory,
    search,
    search_clear,
    extra_entry_points,
):
    creator = users[0]
    record = record_with_files_factory(creator.identity)
    with logged_client(creator).get(
        f"/simple-model/records/{record['id']}/export/ui_json"
    ) as resp:  # TODO: the serializer results dont differ here
        assert resp.status_code == 200
        data = json.loads(resp.text)

        # Core fields
        assert data["id"] == record["id"]
        assert data["is_published"] is True
        assert data["is_draft"] is False
        assert data["status"] == "published"
        assert data["metadata"]["title"] == "blabla"

        # Timestamps
        assert "created" in data
        assert "updated" in data

        # Links
        links = data["links"]
        assert links["self"].endswith(f"/api/simple-model/{record['id']}")
        assert links["files"].endswith(f"/api/simple-model/{record['id']}/files")
        assert links["media_files"].endswith(f"/api/simple-model/{record['id']}/media-files/files")
        assert links["self_html"].endswith(f"/simple-model/records/{record['id']}")
        assert links["edit_html"].endswith(f"/simple-model/uploads/{record['id']}")

        # Files
        files = data["files"]
        assert files["enabled"] is True
        assert files["count"] == 1
        assert "test.pdf" in files["entries"]
        test_pdf = files["entries"]["test.pdf"]
        assert test_pdf["mimetype"] == "application/pdf"
        assert test_pdf["size"] == 8
        assert test_pdf["access"]["hidden"] is False

        # Parent + ownership
        parent = data["parent"]
        assert parent["id"] == record["parent"]["id"]
        assert parent["access"]["owned_by"]["user"] == creator.id
        owner = data["expanded"]["parent"]["access"]["owned_by"]
        assert owner["id"] == creator.id
        assert owner["email"] == creator.email
        assert owner["is_current_user"] is True

        # Access section
        access = data["access"]
        assert access["record"] == "public"
        assert access["files"] == "public"
        assert access["status"] == "open"
        assert access["embargo"]["active"] is False

        # PIDs
        assert "oai" in data["pids"]
        assert data["pids"]["oai"]["identifier"].startswith("oai:")

        # UI section
        ui = data["ui"]
        assert "created_date_l10n_short" in ui
        assert ui["access_status"]["id"] == "open"
        assert ui["access_status"]["title_l10n"] == "Open"
        assert ui["is_draft"] == "false"
