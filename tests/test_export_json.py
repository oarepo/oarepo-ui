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


def test_export(app, location, logged_client, users, record_with_files_factory, extra_entry_points):
    creator = users[1]
    record = record_with_files_factory(creator.identity)
    with logged_client(creator).get(f"/simple-model/records/{record['id']}/export/json") as resp:
        assert resp.status_code == 200
        data = json.loads(resp.text)

        # Top-level keys
        assert "id" in data
        assert "links" in data
        assert "parent" in data
        assert "versions" in data
        assert "is_published" in data
        assert "is_draft" in data
        assert "$schema" in data
        assert "metadata" in data
        assert "files" in data

        # Spot-check values
        assert data["id"] == record["id"]
        assert data["is_published"] is True
        assert data["is_draft"] is False
        assert data["metadata"]["title"] == "blabla"

        # Files section
        assert data["files"]["enabled"] is True
        # non-rdm serialization does not contain records here

        # Links check
        links = data["links"]
        assert "self" in links
        # TODO: assert "files" in links - this is strange, we need to have a look at it
        assert links["self"].endswith(f"/api/simple-model/{record['id']}")
