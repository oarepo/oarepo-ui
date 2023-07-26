def test_ui_resource_form_config(app, record_ui_resource):
    assert record_ui_resource.config().form_config() == dict(
        current_locale="en",
        locales=[
            {"value": "en", "text": "English"},
            {"value": "cs", "text": "Czech"},
        ],
        default_locale="en",
        languages={"all": [], "common": []},
        links=dict(),
        custom_fields=[],
    )
