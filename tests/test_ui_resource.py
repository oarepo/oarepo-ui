from invenio_access.permissions import system_identity


def test_ui_resource_create_new(app, record_ui_resource, record_service):
    assert record_ui_resource.empty_record(None) == {"title": None}


def test_ui_resource_form_config(app, record_ui_resource):
    # TODO: what is this?
    assert record_ui_resource


def test_permissions_on_detail(
    app, record_ui_resource, simple_record, client, fake_manifest
):
    with client.get(f"/simple-model/{simple_record.id}") as c:
        assert c.status_code == 200
        assert (
            "permissions={"
            "&#39;can_edit&#39;: False, "
            "&#39;can_new_version&#39;: False, "
            "&#39;can_manage&#39;: False, "
            "&#39;can_update_draft&#39;: False, "
            "&#39;can_read_files&#39;: True, "
            "&#39;can_review&#39;: False, "
            "&#39;can_view&#39;: False, "
            "&#39;can_delete_draft&#39;: False, "
            "&#39;can_manage_files&#39;: False, "
            "&#39;can_manage_record_access&#39;: False}"
        ) in c.text


def test_permissions_on_search(
    app, record_ui_resource, simple_record, client, fake_manifest
):
    with client.get(f"/simple-model/") as c:
        assert c.status_code == 200
        assert ("permissions={&#39;can_create&#39;: True}") in c.text


def test_ui_links_on_detail(
    app, record_ui_resource, simple_record, client, fake_manifest
):
    with client.get(f"/simple-model/{simple_record.id}") as c:
        assert c.status_code == 200
        assert (
            f"self:https://127.0.0.1:5000/simple-model/{simple_record.id}\n" in c.text
        )
        assert (
            f"edit:https://127.0.0.1:5000/simple-model/{simple_record.id}/edit\n"
            in c.text
        )


def test_ui_listing(app, record_ui_resource, simple_record, client, fake_manifest):
    with client.get(f"/simple-model/") as c:
        assert c.status_code == 200
        assert "self:https://127.0.0.1:5000/simple-model" in c.text
        assert "next:https://127.0.0.1:5000/simple-model?page=2" in c.text
        assert "create:https://127.0.0.1:5000/simple-model/_new" in c.text

    with client.get(f"/simple-model/?page=2") as c:
        assert c.status_code == 200
        assert "self:https://127.0.0.1:5000/simple-model?page=2" in c.text
        assert "prev:https://127.0.0.1:5000/simple-model?page=1" in c.text
        assert "next:https://127.0.0.1:5000/simple-model?page=3" in c.text
        assert "create:https://127.0.0.1:5000/simple-model/_new" in c.text


def test_service_ui_link(app, record_service, simple_record, fake_manifest):
    data = record_service.read(system_identity, simple_record.id)
    # note: in tests, the ui and api urls are the same, this should be different
    # in production
    assert (
        data.links["self"]
        == f"https://127.0.0.1:5000/api/simple-model/{simple_record.id}"
    )
    assert data.links["ui"] == f"https://127.0.0.1:5000/simple-model/{simple_record.id}"
