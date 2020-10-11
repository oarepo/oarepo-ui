def test_views(app, client):
    resp = client.get('/oarepo/indices/')
    assert resp.status_code == 200
    assert resp.json == {'default-facets': {'endpoints': {},
                                            'facets': [{'code': 'category',
                                                        'facet': {
                                                            'label': 'oarepo.facets.default-facets.category.label'}}],
                                            'filters': []},
                         'default-filters': {'endpoints': {},
                                             'facets': [],
                                             'filters': [{'code': 'category',
                                                          'filter': {
                                                              'label': 'oarepo.filters.default-filters.category.label'}}]},
                         'func': {'endpoints': {'test': {'pid_type': 'tstpid',
                                                         'url': 'http://localhost:5000/test/list/route'}},
                                  'facets': [{'code': 'category',
                                              'facet': {'label': 'my.own.facet.label'}}],
                                  'filters': []},
                         'no-translation-facet': {'endpoints': {},
                                                  'facets': [{'code': 'category',
                                                              'facet': {'label': 'category'}}],
                                                  'filters': []},
                         'no-translation-facets': {'endpoints': {},
                                                   'facets': [{'code': 'category',
                                                               'facet': {'label': 'category'}}],
                                                   'filters': []},
                         'no-translation-filter': {'endpoints': {},
                                                   'facets': [],
                                                   'filters': [{'code': 'category',
                                                                'filter': {'label': 'category'}}]},
                         'no-translation-filters': {'endpoints': {},
                                                    'facets': [],
                                                    'filters': [{'code': 'category',
                                                                 'filter': {'label': 'category'}}]},
                         'translate-facet': {'endpoints': {},
                                             'facets': [{'code': 'category',
                                                         'facet': {'label': 'my.own.facet.label'}}],
                                             'filters': []},
                         'translate-facets-filters': {'endpoints': {},
                                                      'facets': [{'code': 'category',
                                                                  'facet': {'label': 'my.own.facet.category'}}],
                                                      'filters': [{'code': 'category',
                                                                   'filter': {'label': 'my.own.filter.category'}}]},
                         'translate-facets-filters-translator': {'endpoints': {},
                                                                 'facets': [{'code': 'category',
                                                                             'facet': {
                                                                                 'label': 'test-my.own.facet.category'}}],
                                                                 'filters': [{'code': 'category',
                                                                              'filter': {
                                                                                  'label': 'test-my.own.filter.category'}}]},
                         'translate-filter': {'endpoints': {},
                                              'facets': [],
                                              'filters': [{'code': 'category',
                                                           'filter': {'label': 'my.own.filter.label',
                                                                      'type': 'number'}}]}}

    resp = client.get('/oarepo/indices/?ln=cs')
    assert resp.status_code == 200
    assert resp.json == {'default-facets': {'endpoints': {},
                                            'facets': [{'code': 'category',
                                                        'facet': {'label': 'defaultní.kategorie'}}],
                                            'filters': []},
                         'default-filters': {'endpoints': {},
                                             'facets': [],
                                             'filters': [{'code': 'category',
                                                          'filter': {'label': 'defaultní.kategorie'}}]},
                         'func': {'endpoints': {'test': {'pid_type': 'tstpid',
                                                         'url': 'http://localhost:5000/test/list/route'}},
                                  'facets': [{'code': 'category',
                                              'facet': {'label': 'můj.vlastní.facet.label'}}],
                                  'filters': []},
                         'no-translation-facet': {'endpoints': {},
                                                  'facets': [{'code': 'category',
                                                              'facet': {'label': 'category'}}],
                                                  'filters': []},
                         'no-translation-facets': {'endpoints': {},
                                                   'facets': [{'code': 'category',
                                                               'facet': {'label': 'category'}}],
                                                   'filters': []},
                         'no-translation-filter': {'endpoints': {},
                                                   'facets': [],
                                                   'filters': [{'code': 'category',
                                                                'filter': {'label': 'category'}}]},
                         'no-translation-filters': {'endpoints': {},
                                                    'facets': [],
                                                    'filters': [{'code': 'category',
                                                                 'filter': {'label': 'category'}}]},
                         'translate-facet': {'endpoints': {},
                                             'facets': [{'code': 'category',
                                                         'facet': {'label': 'můj.vlastní.facet.label'}}],
                                             'filters': []},
                         'translate-facets-filters': {'endpoints': {},
                                                      'facets': [{'code': 'category',
                                                                  'facet': {'label': 'můj.vlastní.facet.kategorie'}}],
                                                      'filters': [{'code': 'category',
                                                                   'filter': {
                                                                       'label': 'můj.vlastní.filter.kategorie'}}]},
                         'translate-facets-filters-translator': {'endpoints': {},
                                                                 'facets': [{'code': 'category',
                                                                             'facet': {
                                                                                 'label': 'test-my.own.facet.category'}}],
                                                                 'filters': [{'code': 'category',
                                                                              'filter': {
                                                                                  'label': 'test-my.own.filter.category'}}]},
                         'translate-filter': {'endpoints': {},
                                              'facets': [],
                                              'filters': [{'code': 'category',
                                                           'filter': {'label': 'můj.vlastní.filter.label',
                                                                      'type': 'number'}}]}}


def test_view(app, client):
    resp = client.get('/oarepo/indices/translate-facet')
    assert resp.status_code == 200
    assert resp.json == {
        'endpoints': {},
        'facets': [{'code': 'category', 'facet': {'label': 'my.own.facet.label'}}],
        'filters': []
    }

    resp = client.get('/oarepo/indices/translate-facet?ln=cs')
    assert resp.status_code == 200
    assert resp.json == {
        'endpoints': {},
        'facets': [{'code': 'category', 'facet': {'label': 'můj.vlastní.facet.label'}}],
        'filters': []
    }


def test_perms(app, client):
    # special permission handler that returns only facets for indices starting with translate-*
    resp = client.get('/oarepo/indices/?perms=1')
    assert resp.status_code == 200
    assert resp.json == {
        'default-facets': {'endpoints': {},
                           'facets': [{'code': 'category',
                                       'facet': {'label': 'oarepo.facets.default-facets.category.label'}}],
                           'filters': []},
        'default-filters': {'endpoints': {},
                            'facets': [],
                            'filters': [{'code': 'category',
                                         'filter': {'label': 'oarepo.filters.default-filters.category.label'}}]},
        'func': {'endpoints': {'test': {'pid_type': 'tstpid',
                                        'url': 'http://localhost:5000/test/list/route'}},
                 'facets': [],
                 'filters': []},
        'no-translation-facet': {'endpoints': {}, 'facets': [], 'filters': []},
        'no-translation-facets': {'endpoints': {}, 'facets': [], 'filters': []},
        'no-translation-filter': {'endpoints': {},
                                  'facets': [],
                                  'filters': [{'code': 'category',
                                               'filter': {'label': 'category'}}]},
        'no-translation-filters': {'endpoints': {},
                                   'facets': [],
                                   'filters': [{'code': 'category',
                                                'filter': {'label': 'category'}}]},
        'translate-facet': {'endpoints': {},
                            'facets': [{'code': 'category',
                                        'facet': {'label': 'my.own.facet.label'}}],
                            'filters': []},
        'translate-facets-filters': {'endpoints': {},
                                     'facets': [{'code': 'category',
                                                 'facet': {'label': 'my.own.facet.category'}}],
                                     'filters': [{'code': 'category',
                                                  'filter': {'label': 'my.own.filter.category'}}]},
        'translate-facets-filters-translator': {'endpoints': {},
                                                'facets': [{'code': 'category',
                                                            'facet': {'label': 'test-my.own.facet.category'}}],
                                                'filters': [{'code': 'category',
                                                             'filter': {'label': 'test-my.own.filter.category'}}]},
        'translate-filter': {'endpoints': {},
                             'facets': [],
                             'filters': [{'code': 'category',
                                          'filter': {'label': 'my.own.filter.label',
                                                     'type': 'number'}}]}}
