def test_views(app, client):
    resp = client.get('/oarepo/indices/')
    assert resp.status_code == 200
    assert resp.json == {
        'default-facets': {'facets': {'category': {'label': 'oarepo.facets.default-facets.category.label'}},
                           'filters': {},
                           'endpoints': {}},
        'default-filters': {'facets': {},
                            'filters': {'category': {'label': 'oarepo.filters.default-filters.category.label'}},
                            'endpoints': {}},
        'no-translation-facet': {'facets': {'category': {'label': 'category'}},
                                 'filters': {},
                                 'endpoints': {}},
        'no-translation-facets': {'facets': {'category': {'label': 'category'}},
                                  'filters': {},
                                  'endpoints': {}},
        'no-translation-filter': {'facets': {},
                                  'filters': {'category': {'label': 'category'}},
                                  'endpoints': {}},
        'no-translation-filters': {'facets': {},
                                   'filters': {'category': {'label': 'category'}},
                                   'endpoints': {}},
        'translate-facet': {'facets': {'category': {'label': 'my.own.facet.label'}},
                            'filters': {},
                            'endpoints': {}},
        'translate-facets-filters': {'facets': {'category': {'label': 'my.own.facet.category'}},
                                     'filters': {'category': {'label': 'my.own.filter.category'}},
                                     'endpoints': {}},
        'translate-facets-filters-translator': {'facets': {'category': {'label': 'my.own.facet.category'}},
                                                'filters': {'category': {'label': 'my.own.filter.category'}},
                                                'endpoints': {}},
        'translate-filter': {'facets': {},
                             'filters': {'category': {'label': 'my.own.filter.label', 'type': 'number'}},
                             'endpoints': {}},
        'func': {'facets': {'category': {'label': 'my.own.facet.label'}},
                 'filters': {},
                 'endpoints': {
                     'test': {
                         'url': 'http://localhost:5000/test/list/route',
                         'pid_type': 'tstpid'
                     }
                 }
                 },
    }

    resp = client.get('/oarepo/indices/?ln=cs')
    assert resp.status_code == 200
    assert resp.json == {
        'default-facets': {'facets': {'category': {'label': 'defaultní.kategorie'}},
                           'filters': {},
                           'endpoints': {}},
        'default-filters': {'facets': {},
                            'filters': {'category': {'label': 'defaultní.kategorie'}},
                            'endpoints': {}},
        'no-translation-facet': {'facets': {'category': {'label': 'category'}},
                                 'filters': {},
                                 'endpoints': {}},
        'no-translation-facets': {'facets': {'category': {'label': 'category'}},
                                  'filters': {},
                                  'endpoints': {}},
        'no-translation-filter': {'facets': {},
                                  'filters': {'category': {'label': 'category'}},
                                  'endpoints': {}},
        'no-translation-filters': {'facets': {},
                                   'filters': {'category': {'label': 'category'}},
                                   'endpoints': {}},
        'translate-facet': {'facets': {'category': {'label': 'můj.vlastní.facet.label'}},
                            'filters': {},
                            'endpoints': {}},
        'translate-facets-filters': {'facets': {'category': {'label': 'můj.vlastní.facet.kategorie'}},
                                     'filters': {'category': {'label': 'můj.vlastní.filter.kategorie'}},
                                     'endpoints': {}},
        'translate-facets-filters-translator': {'facets': {'category': {'label': 'můj.vlastní.facet.kategorie'}},
                                                'filters': {'category': {'label': 'můj.vlastní.filter.kategorie'}},
                                                'endpoints': {}},
        'translate-filter': {'facets': {},
                             'filters': {'category': {'label': 'můj.vlastní.filter.label', 'type': 'number'}},
                             'endpoints': {}},
        'func': {'facets': {'category': {'label': 'můj.vlastní.facet.label'}},
                 'filters': {},
                 'endpoints': {
                     'test': {
                         'url': 'http://localhost:5000/test/list/route',
                         'pid_type': 'tstpid'
                     }
                 }},
    }


def test_view(app, client):
    resp = client.get('/oarepo/indices/translate-facet')
    assert resp.status_code == 200
    assert resp.json == {
        'facets': {'category': {'label': 'my.own.facet.label'}},
        'filters': {},
        'endpoints': {}
    }

    resp = client.get('/oarepo/indices/translate-facet?ln=cs')
    assert resp.status_code == 200
    assert resp.json == {
        'facets': {'category': {'label': 'můj.vlastní.facet.label'}},
        'filters': {},
        'endpoints': {}
    }


def test_perms(app, client):
    # special permission handler that returns only facets for indices starting with translate-*
    resp = client.get('/oarepo/indices/?perms=1')
    assert resp.status_code == 200
    assert resp.json == {
        'default-facets': {'facets': {'category': {'label': 'oarepo.facets.default-facets.category.label'}},
                           'filters': {},
                           'endpoints': {}},
        'default-filters': {'facets': {},
                            'filters': {'category': {'label': 'oarepo.filters.default-filters.category.label'}},
                            'endpoints': {}},
        'no-translation-facet': {'facets': {},
                                 'filters': {},
                                 'endpoints': {}},
        'no-translation-facets': {'facets': {},
                                  'filters': {},
                                  'endpoints': {}},
        'no-translation-filter': {'facets': {},
                                  'filters': {'category': {'label': 'category'}},
                                  'endpoints': {}},
        'no-translation-filters': {'facets': {},
                                   'filters': {'category': {'label': 'category'}},
                                   'endpoints': {}},
        'translate-facet': {'facets': {'category': {'label': 'my.own.facet.label'}},
                            'filters': {},
                            'endpoints': {}},
        'translate-facets-filters': {'facets': {'category': {'label': 'my.own.facet.category'}},
                                     'filters': {'category': {'label': 'my.own.filter.category'}},
                                     'endpoints': {}},
        'translate-facets-filters-translator': {'facets': {'category': {'label': 'my.own.facet.category'}},
                                                'filters': {'category': {'label': 'my.own.filter.category'}},
                                                'endpoints': {}},
        'translate-filter': {'facets': {},
                             'filters': {'category': {'label': 'my.own.filter.label', 'type': 'number'}},
                             'endpoints': {}},
        'func': {'facets': {},
                 'filters': {},
                 'endpoints': {
                     'test': {
                         'url': 'http://localhost:5000/test/list/route',
                         'pid_type': 'tstpid'
                     }
                 }}
    }
