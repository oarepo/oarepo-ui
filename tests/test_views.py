def test_views(app, client):
    resp = client.get('/oarepo/indices/')
    assert resp.status_code == 200
    assert resp.json == {
        'default-facets': {'facets': {'category': {'label': 'oarepo.facets.default-facets.category.label'}},
                           'filters': {}},
        'default-filters': {'facets': {},
                            'filters': {'category': {'label': 'oarepo.filters.default-filters.category.label'}}},
        'no-translation-facet': {'facets': {'category': {'label': 'category'}},
                                 'filters': {}},
        'no-translation-facets': {'facets': {'category': {'label': 'category'}},
                                  'filters': {}},
        'no-translation-filter': {'facets': {},
                                  'filters': {'category': {'label': 'category'}}},
        'no-translation-filters': {'facets': {},
                                   'filters': {'category': {'label': 'category'}}},
        'translate-facet': {'facets': {'category': {'label': 'my.own.facet.label'}},
                            'filters': {}},
        'translate-facets-filters': {'facets': {'category': {'label': 'my.own.facet.category'}},
                                     'filters': {'category': {'label': 'my.own.filter.category'}}},
        'translate-facets-filters-translator': {'facets': {'category': {'label': 'my.own.facet.category'}},
                                                'filters': {'category': {'label': 'my.own.filter.category'}}},
        'translate-filter': {'facets': {},
                             'filters': {'category': {'label': 'my.own.filter.label'}}}}

    resp = client.get('/oarepo/indices/?ln=cs')
    assert resp.status_code == 200
    assert resp.json == {
        'default-facets': {'facets': {'category': {'label': 'defaultní.kategorie'}},
                           'filters': {}},
        'default-filters': {'facets': {},
                            'filters': {'category': {'label': 'defaultní.kategorie'}}},
        'no-translation-facet': {'facets': {'category': {'label': 'category'}},
                                 'filters': {}},
        'no-translation-facets': {'facets': {'category': {'label': 'category'}},
                                  'filters': {}},
        'no-translation-filter': {'facets': {},
                                  'filters': {'category': {'label': 'category'}}},
        'no-translation-filters': {'facets': {},
                                   'filters': {'category': {'label': 'category'}}},
        'translate-facet': {'facets': {'category': {'label': 'můj.vlastní.facet.label'}},
                            'filters': {}},
        'translate-facets-filters': {'facets': {'category': {'label': 'můj.vlastní.facet.kategorie'}},
                                     'filters': {'category': {'label': 'můj.vlastní.filter.kategorie'}}},
        'translate-facets-filters-translator': {'facets': {'category': {'label': 'můj.vlastní.facet.kategorie'}},
                                                'filters': {'category': {'label': 'můj.vlastní.filter.kategorie'}}},
        'translate-filter': {'facets': {},
                             'filters': {'category': {'label': 'můj.vlastní.filter.label'}}}}


def test_view(app, client):
    resp = client.get('/oarepo/indices/translate-facet')
    assert resp.status_code == 200
    assert resp.json == {
        'facets': {'category': {'label': 'my.own.facet.label'}},
        'filters': {}
    }

    resp = client.get('/oarepo/indices/translate-facet?ln=cs')
    assert resp.status_code == 200
    assert resp.json == {
        'facets': {'category': {'label': 'můj.vlastní.facet.label'}},
        'filters': {}
    }


def test_perms(app, client):
    # special permission handler that returns only facets for indices starting with translate-*
    resp = client.get('/oarepo/indices/?perms=1')
    assert resp.status_code == 200
    assert resp.json == {
        'default-facets': {'facets': {'category': {'label': 'oarepo.facets.default-facets.category.label'}},
                           'filters': {}},
        'default-filters': {'facets': {},
                            'filters': {'category': {'label': 'oarepo.filters.default-filters.category.label'}}},
        'no-translation-facet': {'facets': {},
                                 'filters': {}},
        'no-translation-facets': {'facets': {},
                                  'filters': {}},
        'no-translation-filter': {'facets': {},
                                  'filters': {'category': {'label': 'category'}}},
        'no-translation-filters': {'facets': {},
                                   'filters': {'category': {'label': 'category'}}},
        'translate-facet': {'facets': {'category': {'label': 'my.own.facet.label'}},
                            'filters': {}},
        'translate-facets-filters': {'facets': {'category': {'label': 'my.own.facet.category'}},
                                     'filters': {'category': {'label': 'my.own.filter.category'}}},
        'translate-facets-filters-translator': {'facets': {'category': {'label': 'my.own.facet.category'}},
                                                'filters': {'category': {'label': 'my.own.filter.category'}}},
        'translate-filter': {'facets': {},
                             'filters': {'category': {'label': 'my.own.filter.label'}}}}
