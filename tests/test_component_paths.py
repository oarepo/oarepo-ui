from oarepo_ui.proxies import current_oarepo_ui


def test_component_paths(app):
    component_paths = current_oarepo_ui.catalog.component_paths
    assert "components.Field" in component_paths
    assert "Field" in component_paths
