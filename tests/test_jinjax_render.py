from oarepo_ui.proxies import current_oarepo_ui


def test_jinjax_render(app, record_ui_resource):
    del current_oarepo_ui.catalog.component_paths
    ret = current_oarepo_ui.catalog.render("TestSelectTemplate")

    print(ret)
    assert "B template" in ret
    assert "blahblah" in ret
