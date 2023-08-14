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
        record={},
        data={},
        args={},
        view_args={},
        identity=None,
        extra_context={},
    )

    assert fc == dict(
        current_locale="en",
        locales=[
            {"value": "en", "text": "English"},
            {"value": "cs", "text": "čeština"},
        ],
        default_locale="en",
        custom_fields={'ui': {}},
    )
