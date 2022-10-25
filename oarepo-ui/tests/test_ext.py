def test_components_spec(app):
    eps = app.extensions['oarepo_ui'].components_specifications
    assert len(eps) > 0 and type(eps) == dict
