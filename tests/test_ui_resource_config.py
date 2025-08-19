#
# Copyright (c) 2025 CESNET z.s.p.o.
#
# This file is a part of oarepo-ui (see https://github.com/oarepo/oarepo-ui).
#
# oarepo-ui is free software; you can redistribute it and/or modify it
# under the terms of the MIT License; see LICENSE file for more details.
#
from __future__ import annotations

from invenio_access.permissions import system_identity
from invenio_config.default import ALLOWED_HTML_ATTRS, ALLOWED_HTML_TAGS


def test_ui_resource_form_config(app, test_record_ui_resource):
    # Special instance of record resource
    fc = test_record_ui_resource.config.form_config()
    assert fc == {
        "overridableIdPrefix": "Test.Form",
    }

    test_record_ui_resource.run_components(
        "form_config",
        form_config=fc,
        layout="",
        resource=test_record_ui_resource,
        api_record=None,
        record={},
        data={},
        identity=system_identity,
        extra_context={},
    )

    assert fc == {
        "current_locale": "en",
        "locales": [
            {"value": "en", "text": "English"},
            {"value": "cs", "text": "čeština"},
        ],
        "allowedHtmlTags": ALLOWED_HTML_TAGS,
        "allowedHtmlAttrs": ALLOWED_HTML_ATTRS,
        "default_locale": "en",
        "overridableIdPrefix": "Test.Form",
        "permissions": {
            "can_manage_record_access": False,
            "can_read": True,
            "can_read_deleted_files": True,
            "can_delete": False,
            "can_review": False,
            "can_new_version": False,
            "can_update": True,
            "can_create": True,
            "can_read_files": False,
            "can_manage": False,
            "can_manage_files": False,
            "can_update_files": False,
            "can_edit": False,
            "can_search": True,
            "can_view": False,
        },
        "custom_fields": {
            "ui": [
                {
                    "fields": [{"field": "custom_fields.aaa", "ui_widget": "Input"}],
                    "section": "A",
                },
            ]
        },
    }
