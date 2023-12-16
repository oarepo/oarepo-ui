import json

from invenio_access.permissions import system_identity


def test_ui_resource_create_new(app, record_ui_resource, record_service):
    assert record_ui_resource.empty_record(None) == {"title": ""}


def test_ui_resource_form_config(app, record_ui_resource):
    # TODO: what is this?
    assert record_ui_resource


def test_permissions_on_detail(
    app, record_ui_resource, simple_record, client, fake_manifest
):
    with client.get(f"/simple-model/{simple_record.id}") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data['permissions'] == {
            'can_create': False,
            'can_delete': False,
            'can_delete_draft': False,
            'can_edit': False,
            'can_manage': False,
            'can_manage_files': False,
            'can_manage_record_access': False,
            'can_new_version': False,
            'can_read': True,
            'can_read_deleted_files': False,
            'can_read_files': True,
            'can_review': False,
            'can_search': True,
            'can_update': False,
            'can_update_draft': False,
            'can_update_files': False,
            'can_view': False
        }



def test_filter_on_detail(
    app, record_ui_resource, simple_record, client, fake_manifest
):
    with client.get(f"/simple-model/{simple_record.id}") as c:
        assert c.status_code == 200
        assert "dummy" in c.text


def test_no_permissions_on_search(
    app, record_ui_resource, simple_record, client, fake_manifest
):
    with client.get(f"/simple-model/") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data['permissions'] == {
            'can_create': False
        }

def test_permissions_on_search(
    app, record_ui_resource, simple_record, fake_manifest, client_with_credentials
):
    with client_with_credentials.get(f"/simple-model/") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data['permissions'] == {
            'can_create': True
        }


def test_filter_on_search(
    app, record_ui_resource, simple_record, client, fake_manifest
):
    with client.get(f"/simple-model/") as c:
        assert c.status_code == 200
        assert "dummy" in c.text


def test_ui_links_on_detail(
    app, record_ui_resource, simple_record, client, fake_manifest
):
    with client.get(f"/simple-model/{simple_record.id}") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data['ui_links'] == {
            'edit': f'https://127.0.0.1:5000/simple-model/{simple_record.id}/edit',
             'search': 'https://127.0.0.1:5000/simple-model/',
             'self': f'https://127.0.0.1:5000/simple-model/{simple_record.id}'
        }


def test_ui_listing(app, record_ui_resource, simple_record, client, fake_manifest):
    with client.get(f"/simple-model/") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data['ui_links'] == {
            "create": "https://127.0.0.1:5000/simple-model/_new",
             "next": "https://127.0.0.1:5000/simple-model?page=2",
            "self": "https://127.0.0.1:5000/simple-model"
        }

    with client.get(f"/simple-model/?page=2") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert data['ui_links'] == {
            'create': 'https://127.0.0.1:5000/simple-model/_new',
            'next': 'https://127.0.0.1:5000/simple-model?page=3',
            'prev': 'https://127.0.0.1:5000/simple-model?page=1',
            'self': 'https://127.0.0.1:5000/simple-model?page=2'
        }


def test_service_ui_link(app, record_service, simple_record, fake_manifest):
    data = record_service.read(system_identity, simple_record.id)
    # note: in tests, the ui and api urls are the same, this should be different
    # in production
    assert (
        data.links["self"]
        == f"https://127.0.0.1:5000/api/simple-model/{simple_record.id}"
    )
    assert data.links["ui"] == f"https://127.0.0.1:5000/simple-model/{simple_record.id}"
