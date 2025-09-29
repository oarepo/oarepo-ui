#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations


def test_template_page(app, client):
    with client.get("/") as c:
        assert c.status_code == 200
        assert "frontpage-search-bar" in c.text
