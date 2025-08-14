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


def test_template_page(app, titlepage_ui_resource, client):
    with client.get("/") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert "ok" in data
