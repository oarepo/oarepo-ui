from oarepo_ui.proxies import current_oarepo_ui


def test_ui_models_loaded(app):
    ui_models = current_oarepo_ui.ui_models
    assert ui_models == {
        'simple_model': {
            "test": "ok"
        }
    }