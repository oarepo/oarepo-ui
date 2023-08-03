from flask import request
from flask_resources import resource_requestctx
from flask_resources.context import ResourceRequestCtx
from invenio_access.permissions import system_identity


def test_ui_resource_create_new(app, record_ui_resource):
    assert record_ui_resource.empty_record(None) == {
        "created": None,
        "description": None,
        "icon": None,
        "id": None,
        "links": None,
        "props": None,
        "revision_id": None,
        "tags": [None],
        "title": None,
        "type": None,
        "updated": None,
    }


def test_ui_links_on_detail(app, record_ui_resource, simple_record, client, fake_manifest):
    with client.get(f'/simple-model/{simple_record.id}') as c:
        assert c.status_code == 200
        assert f'self:https://127.0.0.1:5000/simple-model/{simple_record.id}\n' in c.text
        assert f'edit:https://127.0.0.1:5000/simple-model/{simple_record.id}/edit\n' in c.text
