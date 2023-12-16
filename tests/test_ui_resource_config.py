from invenio_access.permissions import system_identity


def test_ui_resource_form_config(app, record_ui_resource):
    fc = record_ui_resource.config.form_config()
    assert fc == dict(
        custom_fields={"ui": {}},
    )

    record_ui_resource.run_components(
        "form_config",
        form_config=fc,
        layout="",
        resource=record_ui_resource,
        api_record=None,
        record={},
        data={},
        args={},
        view_args={},
        identity=system_identity,
        extra_context={},
    )

    assert fc == dict(
        current_locale="en",
        locales=[
            {"value": "en", "text": "English"},
            {"value": "cs", "text": "čeština"},
        ],
        default_locale="en",
        custom_fields={"ui": {}},
        permissions={
            'can_create': True,
                 'can_delete': False,
                 'can_delete_draft': False,
                 'can_edit': False,
                 'can_manage': False,
                 'can_manage_files': False,
                 'can_manage_record_access': False,
                 'can_new_version': False,
                 'can_read': True,
                 'can_read_deleted_files': False,
                 'can_read_files': False,
                 'can_review': False,
                 'can_search': True,
                 'can_update': True,
                 'can_update_draft': False,
                 'can_update_files': False,
                 'can_view': False
        },
    )
