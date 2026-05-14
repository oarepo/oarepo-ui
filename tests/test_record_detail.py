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

import pytest


@pytest.mark.skip("We need to have a look at this and maybe move to rdm")
def test_record_detail(app, location, logged_client, users, record_factory, extra_entry_points):
    creator = users[0]
    published_record = record_factory(creator.identity)
    assert "self_html" in published_record["links"]
    url = published_record["links"]["self_html"].split("/", 3)[-1]
    with logged_client(creator).get(f"/{url}") as resp:
        assert resp.status_code == 200
        response = json.loads(resp.text)
        expected_top_keys = {
            "record_ui",
            "files",
            "media_files",
            "permissions",
            "is_preview",
            "include_deleted",
            "is_draft",
            "community",
            "community_ui",
            "user_avatar",
            "record_owner_id",
            "model_name",
        }
        assert expected_top_keys.issubset(response.keys())

        record_ui = response["record_ui"]
        assert isinstance(record_ui, dict)
        assert "ui" in record_ui

        ui = record_ui["ui"]
        for field in (
            "created_date_l10n_full",
            "created_date_l10n_long",
            "created_date_l10n_medium",
            "created_date_l10n_short",
            "updated_date_l10n_full",
            "updated_date_l10n_long",
            "updated_date_l10n_medium",
            "updated_date_l10n_short",
        ):
            assert field in ui

        files = response["files"]
        assert isinstance(files, dict)
        assert files["enabled"] is False

        perms = response["permissions"]
        assert isinstance(perms, dict)
        assert perms.get("can_manage") is True

        assert response["is_preview"] is False
        assert response["include_deleted"] is False
        assert response["is_draft"] is False

        assert "community" in response

        assert response["user_avatar"].endswith(f"/api/users/{creator.id}/avatar.svg")
        assert response["record_owner_id"] == creator.id

        # # checky na Link hlavicku v response
        assert "<https://orcid.org/0000-0001-5727-2427>; rel=author; " in resp.headers["Link"]
        assert "<https://ror.org/04wxnsj81>; rel=author; " in resp.headers["Link"]
        assert "<https://doi.org/10.82433/b09z-4k37>; rel=cite-as; " in resp.headers["Link"]
        assert '/export/json>; rel=describedby; type="application/json"; ' in resp.headers["Link"]
        assert '/export/lset>; rel=describedby; type="application/linkset"; ' in resp.headers["Link"]
        assert '/export/jsonlset>; rel=describedby; type="application/linkset+json"; ' in resp.headers["Link"]
        assert '/export/ui_json>; rel=describedby; type="application/vnd.inveniordm.v1+json"; ' in resp.headers["Link"]
        assert (
            '/export/datacite>; rel=describedby; type="application/vnd.datacite.datacite+json"; '
            in resp.headers["Link"]
        )
        assert f'anchor="https://127.0.0.1:5000/simple-model/records/{record_ui["id"]}", ' in resp.headers["Link"]


def test_record_detail_runs_with_scoped_export_cache(app, monkeypatch):
    import oarepo_ui.resources.decorators.content_negotiation as content_negotiation
    from oarepo_runtime.api import ExportEngine
    from oarepo_ui.resources.records.resource import RecordsUIResource

    observed_caches = []

    class FakeRecord:
        id = "test-record"

        def to_dict(self):
            return {
                "$schema": "local://simple-model-record-v1.0.0.json",
                "id": self.id,
            }

    class FakeModel:
        def api_url(self, _action, pid_value):
            return f"/api/simple-model/{pid_value}"

    class FakeModelsBySchema:
        def __getitem__(self, _schema):
            observed_caches.append(ExportEngine.export_cache_context.get())
            return FakeModel()

    class FakeRuntime:
        models_by_schema = FakeModelsBySchema()

    monkeypatch.setattr(content_negotiation, "current_runtime", FakeRuntime())

    cached_record_detail = RecordsUIResource.record_detail.__wrapped__.__wrapped__.__wrapped__

    with app.test_request_context(headers={"Accept": "application/json"}):
        response = cached_record_detail(object(), record=FakeRecord())

    assert observed_caches
    assert all(cache is not None for cache in observed_caches)
    assert response.status_code == 302
    assert response.location == "/api/simple-model/test-record"
    assert ExportEngine.export_cache_context.get() is None
