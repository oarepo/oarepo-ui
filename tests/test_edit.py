#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

import json

from invenio_config.default import ALLOWED_HTML_ATTRS, ALLOWED_HTML_TAGS


def test_edit(app, resources, simple_record, client_with_credentials):
    with client_with_credentials.get(f"/simple-model/{simple_record.id}/edit") as c:
        response = json.loads(c.text)
        response["data"].pop("created")
        response["data"].pop("updated")
        response["record"].pop("created")
        response["record"].pop("updated")

        ui = response["data"].pop("ui")
        assert "created_date_l10n_full" in ui
        assert "created_date_l10n_long" in ui
        assert "created_date_l10n_medium" in ui
        assert "created_date_l10n_short" in ui
        assert "updated_date_l10n_full" in ui
        assert "updated_date_l10n_long" in ui
        assert "updated_date_l10n_medium" in ui
        assert "updated_date_l10n_short" in ui

        ui = response["record"].pop("ui")
        assert "created_date_l10n_full" in ui
        assert "created_date_l10n_long" in ui
        assert "created_date_l10n_medium" in ui
        assert "created_date_l10n_short" in ui
        assert "updated_date_l10n_full" in ui
        assert "updated_date_l10n_long" in ui
        assert "updated_date_l10n_medium" in ui
        assert "updated_date_l10n_short" in ui

        assert response == {
            "api_record": simple_record.id,
            "data": {
                "expanded": {},
                "extra_links": {
                    "search_link": "/simple-model",
                    "ui_links": {
                        "edit": f"https://127.0.0.1:5000/simple-model/{simple_record.id}/edit",
                        "search": "https://127.0.0.1:5000/simple-model/",
                        "self": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
                    },
                },
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
                            "fields": [{"field": "custom_fields.aaa", "ui_widget": "Input"}],
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
                "expanded": {},
                "extra_links": {
                    "search_link": "/simple-model",
                    "ui_links": {
                        "edit": f"https://127.0.0.1:5000/simple-model/{simple_record.id}/edit",
                        "search": "https://127.0.0.1:5000/simple-model/",
                        "self": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
                    },
                },
                "links": {
                    "self": f"https://127.0.0.1:5000/api/simple-model/{simple_record.id}",
                    "ui": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
                },
            },
            "ui_links": {
                "edit": f"https://127.0.0.1:5000/simple-model/{simple_record.id}/edit",
                "search": "https://127.0.0.1:5000/simple-model/",
                "self": f"https://127.0.0.1:5000/simple-model/{simple_record.id}",
            },
        }
