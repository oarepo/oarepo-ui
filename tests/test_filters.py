from pprint import pprint

import pytest
from elasticsearch_dsl.query import Terms
from invenio_records_rest.facets import terms_filter

from oarepo_ui.filters import boolean_filter, date_year_range, exclude_filter


def test_exclude_filter():
    f = exclude_filter(terms_filter('test'))
    res = f(['a', 'b']).to_dict()
    assert res == {'bool': {'must_not': [{'terms': {'test': ['a', 'b']}}]}}
    pprint(res)


@pytest.mark.parametrize(("value", "result"),
                         [("1", {'terms': {'test': [True]}}), ("0", {'terms': {'test': [False]}}),
                          ("true", {'terms': {'test': [True]}}),
                          ("false", {'terms': {'test': [False]}}),
                          (True, {'terms': {'test': [True]}}),
                          (False, {'terms': {'test': [False]}})])
def test_boolean_filter(value, result):
    f = boolean_filter('test')
    res = f([value]).to_dict()
    assert res == result

def test_date_year_range():
    f = date_year_range(
        'test_field',
        format='yyyy-mm',
        start_date_math='/y',
        end_date_math='/y'
    )
    res = f(["2008"]).to_dict()
    assert res == {'range': {'test_field': {'format': 'yyyy-mm', 'gte': '2008-01||/y', 'lte': '2008-12||/y'}}}
