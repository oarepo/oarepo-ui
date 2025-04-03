import json


def test_export(
    app, record_ui_resource, simple_record, client_with_credentials, fake_manifest
):
    with client_with_credentials.get(
        f"/simple-model/{simple_record.id}/export/json"
    ) as c:
        text = json.loads(c.text)
        assert {
            "$schema": "local://simple_model-1.0.0.json",
            "expanded": {},
            "id": simple_record.id,
            "links": {
                "self": f"https://127.0.0.1:5000/api/simple-model/{simple_record.id}",
                "self_html": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
            },
            "metadata": {},
            "revision_id": 1,
        }.items() <= text.items()

def test_inveniordm(
    app, record_ui_resource, simple_record, client_with_credentials, fake_manifest
):
    with client_with_credentials.get(
        f"/simple-model/{simple_record.id}/export/inveniordm_json"
    ) as c: # todo the serializer results dont differ here
        text = json.loads(c.text)
        assert {
            "$schema": "local://simple_model-1.0.0.json",
            "expanded": {},
            "id": simple_record.id,
            "links": {
                "self": f"https://127.0.0.1:5000/api/simple-model/{simple_record.id}",
                "self_html": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
            },
            "metadata": {},
            "revision_id": 1,
        }.items() <= text.items()

def test_nonexistent(
    app, record_ui_resource, simple_record, client_with_credentials, fake_manifest
):
    with client_with_credentials.get(
        f"/simple-model/{simple_record.id}/export/blahblah"
    ) as c:
        assert c.status_code == 404