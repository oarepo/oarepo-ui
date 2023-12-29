import json


def test_template_page(
    app, titlepage_ui_resource, client, fake_manifest
):
    with client.get("/") as c:
        assert c.status_code == 200
        data = json.loads(c.text)
        assert 'ok' in data
