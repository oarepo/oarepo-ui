# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

from __future__ import annotations

import json


def test_search(app, location, logged_client, users, record_factory, extra_entry_points):
    creator = users[0]
    record_factory(creator.identity)

    with logged_client(creator).get("/simple-model/") as resp:
        assert resp.status_code == 200
        response = json.loads(resp.text)

        assert "ui_links" in response
        assert "search_config" in response

        search_config = response["search_config"]
        assert isinstance(search_config, dict)
        assert search_config["appId"] == "Simple_model"


def test_search_without_trailing_slash_redirects(logged_client, users):
    creator = users[0]

    resp = logged_client(creator).get("/simple-model")
    assert resp.status_code == 302
    assert resp.headers["Location"].endswith("/simple-model/")
