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


def test_export(
    app,
    record_api_resource,
    record_ui_resource,
    simple_record,
    client_with_credentials,
):
    with client_with_credentials.get(f"/simple-model/{simple_record.id}/export/json") as c:
        text = json.loads(c.text)
        text.pop("created")
        text.pop("updated")
        assert text == {
            "expanded": {},
            "links": {
                "self": f"https://127.0.0.1:5000/api/simple-model/{simple_record.id}",
                "ui": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
            },
        }


def test_inveniordm(
    app,
    record_api_resource,
    record_ui_resource,
    simple_record,
    client_with_credentials,
    search,
    search_clear,
):
    with client_with_credentials.get(
        f"/simple-model/{simple_record.id}/export/ui_json"
    ) as c:  # TODO: the serializer results dont differ here
        text = json.loads(c.text)
        text.pop("created")
        text.pop("updated")
        ui = text.pop("ui")
        assert "created_date_l10n_full" in ui
        assert "created_date_l10n_long" in ui
        assert "created_date_l10n_medium" in ui
        assert "created_date_l10n_short" in ui
        assert "updated_date_l10n_full" in ui
        assert "updated_date_l10n_long" in ui
        assert "updated_date_l10n_medium" in ui
        assert "updated_date_l10n_short" in ui
        assert text == {
            "expanded": {},
            "links": {
                "self": f"https://127.0.0.1:5000/api/simple-model/{simple_record.id}",
                "ui": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
            },
        }


def test_nonexistent(app, record_ui_resource, simple_record, client_with_credentials):
    with client_with_credentials.get(f"/simple-model/{simple_record.id}/export/blahblah") as c:
        assert c.status_code == 404
