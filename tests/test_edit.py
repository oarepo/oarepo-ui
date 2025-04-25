import json

from invenio_config.default import ALLOWED_HTML_ATTRS, ALLOWED_HTML_TAGS


def test_edit(
    app, record_ui_resource, simple_record, client_with_credentials, fake_manifest
):
    with client_with_credentials.get(f"/simple-model/{simple_record.id}/edit") as c:
        assert json.loads(c.text) == {
            "api_record": simple_record.id,
            "data": {
                "expanded": {},
                "links": {
                    "self": f"https://127.0.0.1:5000/api/simple-model/{simple_record.id}",
                    "ui": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
                },
            },
            "extra_context": {
                "permissions": {
                    "can_create": True,
                    "can_delete": True,
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
                    "can_update_files": True,
                    "can_view": False,
                }
            },
            "form_config": {
                "allowedHtmlTags": ALLOWED_HTML_TAGS,
                "allowedHtmlAttrs": ALLOWED_HTML_ATTRS,
                "current_locale": "en",
                "custom_fields": {
                    "ui": [
                        {
                            "fields": [{"field": "bbb", "ui_widget": "Input"}],
                            "section": "B",
                        },
                        {
                            "fields": [
                                {"field": "nested_cf.aaa", "ui_widget": "Input"}
                            ],
                            "section": "A",
                        },
                    ]
                },
                "default_locale": "en",
                "overridableIdPrefix": "Default.Form",
                "locales": [
                    {"text": "English", "value": "en"},
                    {"text": "čeština", "value": "cs"},
                ],
                "permissions": {
                    "can_create": True,
                    "can_delete": True,
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
                    "can_update_files": True,
                    "can_view": False,
                },
                "ui_model": {"test": "ok"},
                "updateUrl": f"https://127.0.0.1:5000/api/simple-model/{simple_record.id}",
            },
            "record": {
                "extra_links": {
                    "search_link": "/simple-model",
                    "ui_links": {
                        "edit": f"https://127.0.0.1:5000/simple-model/{simple_record.id}/edit",
                        "search": "https://127.0.0.1:5000/simple-model/",
                        "self": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
                    },
                }
            },
            "ui_links": {
                "edit": f"https://127.0.0.1:5000/simple-model/{simple_record.id}/edit",
                "search": "https://127.0.0.1:5000/simple-model/",
                "self": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
            },
        }
