import json


def test_default_components(
    app, record_ui_resource, simple_record, client_with_credentials, fake_manifest
):
    with client_with_credentials.get(f"/simple-model/") as c:
        txt = json.loads(c.text)
        search_config = txt["search_config"]

        assert search_config['defaultComponents'] == {}
