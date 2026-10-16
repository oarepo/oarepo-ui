# SPDX-FileCopyrightText: 2025 CESNET z.s.p.o
# SPDX-License-Identifier: MIT

from __future__ import annotations


def test_multiple_http_methods(app, client):
    with client.get("/simple-model/multiple_methods") as resp:
        assert resp.status_code == 200
        assert "Inside." in resp.text

    with client.post("/simple-model/multiple_methods") as resp:
        assert resp.status_code == 201
        assert "Inside." in resp.text

    with client.delete("/simple-model/multiple_methods") as resp:
        assert resp.status_code == 200
        assert "Inside." in resp.text

    # PUT is not allowed
    with client.put("/simple-model/multiple_methods") as resp:
        assert resp.status_code == 405
        assert "Inside." not in resp.text
