import json


def test_create(
    app, record_ui_resource, simple_record, client_with_credentials, fake_manifest
):
    with client_with_credentials.get("/simple-model/_new") as c:
        assert json.loads(c.text) == {
            "data": {"title": ""},
            "extra_context": {
                "permissions": {
                    "can_create": True,
                    "can_delete": True,
                    "can_delete_draft": False,
                    "can_edit": False,
                    "can_manage": False,
                    "can_manage_files": False,
                    "can_manage_record_access": False,
                    "can_new_version": False,
                    "can_read": True,
                    "can_read_deleted_files": True,
                    "can_read_files": True,
                    "can_review": False,
                    "can_search": True,
                    "can_update": True,
                    "can_update_draft": False,
                    "can_update_files": True,
                    "can_view": False,
                }
            },
            "form_config": {
                "createUrl": "/api/simple-model",
                "current_locale": "en",
                "custom_fields": {"ui": {}},
                "default_locale": "en",
                'overridableIdPrefix': 'Default.Form',
                "locales": [
                    {"text": "English", "value": "en"},
                    {"text": "\u010de\u0161tina", "value": "cs"},
                ],
                "permissions": {
                    "can_create": True,
                    "can_delete": True,
                    "can_delete_draft": False,
                    "can_edit": False,
                    "can_manage": False,
                    "can_manage_files": False,
                    "can_manage_record_access": False,
                    "can_new_version": False,
                    "can_read": True,
                    "can_read_deleted_files": True,
                    "can_read_files": True,
                    "can_review": False,
                    "can_search": True,
                    "can_update": True,
                    "can_update_draft": False,
                    "can_update_files": True,
                    "can_view": False,
                },
            },
            "record": {"title": ""},
            "ui_links": {},
        }
