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


def test_default_components(app, record_ui_resource, record_api_resource, simple_record, client_with_credentials):
    with client_with_credentials.get("/simple-model/") as c:
        txt = json.loads(c.text)
        search_config = txt["search_config"]

        assert search_config["defaultComponents"] == {}
