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


def test_default_components(app, location, users, logged_client, record_factory):
    record_factory(users[0].identity)
    with logged_client(users[0]).get("/simple-model/") as resp:
        assert resp.status_code == 200
        txt = json.loads(resp.text)
        search_config = txt["search_config"]

        assert (
            "Simple_model.Search.ResultsList.item.local://simple_model-v1.0.0.json"
            in search_config["defaultComponents"]
        )
