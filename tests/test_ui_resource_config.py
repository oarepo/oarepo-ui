def test_ui_resource_form_config(app, record_ui_resource):
    fc = record_ui_resource.config().form_config()
    assert fc == dict(
        links=dict(),
        custom_fields={"ui": {}},
    )

    record_ui_resource.run_components(
        "form_config",
        form_config=fc,
        layout='',
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
            # TODO: not sure why current_i18.get_locales() puts English twice here
            {"value": "en", "text": "English"},
            {"value": "en", "text": "English"},
            {"value": "cs", "text": "čeština"},
        ],
        default_locale="en",
        languages={
            "all": [
                {"value": "en", "text": "English"},
                {"value": "cs", "text": "čeština"},
            ],
            "common": [],
        },
        links=dict(),
        custom_fields={"ui": {}},
    )