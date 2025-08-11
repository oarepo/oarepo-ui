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

from invenio_access.permissions import system_identity
from invenio_accounts.testutils import login_user_via_session


def test_ui_resource_create_new(app, resources, record_ui_resource, record_api_resource, record_service):
    assert record_ui_resource.empty_record() == {
        "title": "",
        "created": None,
        "updated": None,
    }


def test_ui_resource_form_config(app, resources, record_ui_resource, record_api_resource):
    # TODO: what is this?
    assert record_ui_resource


def test_permissions_on_detail(
    app,
    resources,
    record_ui_resource,
    record_api_resource,
    simple_record,
    client,
    users,
):
    with client.get(f"/simple-model/{simple_record.id}") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data["permissions"] == {
            "can_create": False,
            "can_delete": False,
            "can_edit": False,
            "can_manage": False,
            "can_manage_files": False,
            "can_manage_record_access": False,
            "can_new_version": False,
            "can_read": True,
            "can_read_deleted_files": False,
            "can_read_files": True,
            "can_review": False,
            "can_search": True,
            "can_update": False,
            "can_update_files": False,
            "can_view": False,
        }


def test_current_user(
    app,
    resources,
    record_ui_resource,
    record_api_resource,
    simple_record,
    client,
    users,
):
    with client.get(f"/simple-model/{simple_record.id}") as c:
        data = json.loads(c.text)
        assert "&lt;flask_security.core.AnonymousUser" in data["current_user"]

    login_user_via_session(client, email=users[0].email)

    with client.get(f"/simple-model/{simple_record.id}") as c:
        data = json.loads(c.text)
        assert "User &lt;id=1, email=user1@example.org&gt;" in data["current_user"]


def test_filter_on_detail(app, resources, record_ui_resource, record_api_resource, simple_record, client):
    with client.get(f"/simple-model/{simple_record.id}") as c:
        assert c.status_code == 200
        assert "dummy" in c.text


def test_no_permissions_on_search(app, resources, record_ui_resource, record_api_resource, simple_record, client):
    with client.get("/simple-model/") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data["permissions"] == {"can_create": False}


def test_permissions_on_search(
    app,
    resources,
    record_ui_resource,
    record_api_resource,
    simple_record,
    client_with_credentials,
):
    with client_with_credentials.get("/simple-model/") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data["permissions"] == {"can_create": True}


def test_filter_on_search(app, resources, record_ui_resource, record_api_resource, simple_record, client):
    with client.get("/simple-model/") as c:
        assert c.status_code == 200
        assert "dummy" in c.text


def test_ui_links_on_detail(app, resources, record_ui_resource, record_api_resource, simple_record, client):
    with client.get(f"/simple-model/{simple_record.id}") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data["ui_links"] == {
            "edit": f"https://127.0.0.1:5000/simple-model/{simple_record.id}/edit",
            "search": "https://127.0.0.1:5000/simple-model/",
            "self": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
        }


def test_ui_listing(app, resources, record_ui_resource, record_api_resource, simple_record, client):
    with client.get("/simple-model/") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data["ui_links"] == {
            "create": "https://127.0.0.1:5000/simple-model/_new",
            "next": "https://127.0.0.1:5000/simple-model/?page=2&size=10",
            "self": "https://127.0.0.1:5000/simple-model/?page=1&size=10",
        }
        assert data["search_config"]["ignoredSearchFilters"] == ["allversions"]
        assert data["search_config"]["additionalFilterLabels"] == {}

    with client.get("/simple-model/?page=2") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data["ui_links"] == {
            "create": "https://127.0.0.1:5000/simple-model/_new",
            "next": "https://127.0.0.1:5000/simple-model/?page=3&size=10",
            "prev": "https://127.0.0.1:5000/simple-model/?page=1&size=10",
            "self": "https://127.0.0.1:5000/simple-model/?page=2&size=10",
        }


def test_service_ui_link(app, resources, record_service, simple_record):
    data = record_service.read(system_identity, simple_record.id)
    # note: in tests, the ui and api urls are the same, this should be different
    # in production
    assert data.links["self"] == f"https://127.0.0.1:5000/api/simple-model/{simple_record.id}"
    assert data.links["ui"] == f"https://127.0.0.1:5000/simple-model/{simple_record.id}"
