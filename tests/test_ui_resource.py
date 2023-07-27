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


def test_ui_resource_form_config(app, record_ui_resource):
    assert record_ui_resource