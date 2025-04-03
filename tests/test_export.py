import json


def test_export(
    app, record_api_resource, record_ui_resource, simple_record, client_with_credentials, fake_manifest
):
    with client_with_credentials.get(
        f"/simple-model/{simple_record.id}/export/json"
    ) as c:
        text = json.loads(c.text)
        assert text == {'expanded': {}, 'links': {'self': f'https://127.0.0.1:5000/api/simple-model/{simple_record.id}',
                                          'ui': f'https://127.0.0.1:5000/simple-model/{simple_record.id}'}}

def test_inveniordm(
    app, record_api_resource, record_ui_resource, simple_record, client_with_credentials, fake_manifest
):
    with client_with_credentials.get(
        f"/simple-model/{simple_record.id}/export/inveniordm_json"
    ) as c: # todo the serializer results dont differ here
        text = json.loads(c.text)
        assert text == {'expanded': {}, 'links': {'self': f'https://127.0.0.1:5000/api/simple-model/{simple_record.id}',
                                          'ui': f'https://127.0.0.1:5000/simple-model/{simple_record.id}'}}
def test_nonexistent(
    app, record_ui_resource, simple_record, client_with_credentials, fake_manifest
):
    with client_with_credentials.get(
        f"/simple-model/{simple_record.id}/export/blahblah"
    ) as c:
        assert c.status_code == 404