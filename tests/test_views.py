def test_view(app, client):
    resp = client.options('/test/list/route')
    assert resp.status_code == 200
    assert resp.json == {
        'facets': [{'code': 'category', 'facet': {'label': 'my.own.facet.label'}}],
        'filters': []
    }

    # TODO: implement ?ln=
    # resp = client.options('/test/list/route?ln=cs')
    # assert resp.status_code == 200
    # assert resp.json == {
    #     'facets': [{'code': 'category', 'facet': {'label': 'můj.vlastní.facet.label'}}],
    #     'filters': []
    # }

# TODO: add more endpoints and tests
