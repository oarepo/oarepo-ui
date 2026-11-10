# SPDX-FileCopyrightText: 2023-2026 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

from __future__ import annotations


def test_template_page(app, client):
    with client.get("/") as resp:
        assert resp.status_code == 200
        assert "frontpage-search" in resp.text
