def test_ui_resource_form_config(app, record_ui_resource_config):
    assert record_ui_resource_config.form_config() == dict(
        
    )