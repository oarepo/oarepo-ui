# OARepo API for UI

[![image][]][1]
[![image][2]][3]
[![image][4]][5]
[![image][6]][7]

API for UI in OAREPO

## Instalation

```bash
    pip install oarepo-ui
```
## Usage

This library provides a set of APIs for writing oarepo javascript UI client.

### ``OPTIONS https://localhost:5000/api/<record list endpoint>/?ln=<lang>``

Returns known facets of all mappings registered in ``RECORDS_REST_FACETS``

Response:
```json5
{
    "facets": {
        "facet-key": {
            "label": "translated facet label",
        }
    },
    "filters": {
        "filter-key": {
            "label": "translated filter label",
            "type": "one of string, number, date, time, datetime"
        }
    }
}
```


## Configuration

### ``OAREPO_UI_TRANSLATOR``

Unless configured otherwise, ``oarepo-ui`` uses flask-babelex to perform translation of labels/values.
This setting can be changed by specifying config option ``OAREPO_UI_TRANSLATOR``. The translator
accepts key (and bunch of ``kwargs`` according to the context) and returns translated value.

### Translation keys

The default keys being fed into babel are:
   * oarepo.facets.<index-name>.<facet-key>.label
   * facet values are not translated
   * oarepo.filters.<index-name>.<filter-key>.label
   
This can be changed on index-level or facet-level.

#### Index-level key override

If ``label``, ``value`` and ``translator`` are unfilled, the default will be used

```python
from oarepo_ui import translate_facets, translate_filters

FACETS = {
    'category': {
        'terms': {
            'field': 'category',
        },
    }
}
FILTERS = ...

RECORDS_REST_FACETS = {
    'records-record-v1.0.0': {
        'aggs': translate_facets(FACETS, 
                                 label='my.own.{facet_key}', 
                                 value='my.own.{facet_key}.{value_key}', 
                                 translator=lambda key, **kwargs: ...),
        'filters': translate_filters(FILTERS, label='my.own.{filter_key}', 
                                     translator=lambda key, **kwargs: ...)
    },
}
```

If you do not want to translate the label, use ``oarepo_ui.no_translation`` in ``label``
or use ``keep_facets``, ``keep_facet``, ``keep_filters``, ``keep_filter`` instead.


#### Facet-level key override

```python
from oarepo_ui import translate_facet

RECORDS_REST_FACETS = {
    'records-record-v1.0.0': {
        'aggs': {
            'category': translate_facet(
                {
                    'terms': {
                        'field': 'category',
                    },
                }, 
                label='my.own.key', 
                value='my.own.{value_key}', 
                translator=lambda key, **kwargs: ...)
        }
   }
}
```

#### Filter-level key override
```python
from invenio_records_rest.facets import terms_filter
from oarepo_ui import translate_filter

RECORDS_REST_FACETS = {
    'records-record-v1.0.0': {
        'filters': {
            'category': translate_filter(
                terms_filter('category'), 
                label='my.own.key', 
                translator=lambda key, **kwargs: ...)
        }
   }
}
```

### Permissions

``translate_facets``, ``translate_facet`` can receive additional parameter ``permissions``. Pass a permission
factory function ``perm(index, facet, **kwargs) -> `` that returns an object with a ``.can()`` method.
If it returns ``True``, the facet will be returned in ``https://localhost:5000/api/oarepo/indices/<index-name>?ln=<lang>``
call.

Note that this does not prevent client to use any filters he/she wants - no permissions are enforced on ``filter`` level.

```python
from oarepo_ui import translate_facets, translate_filters

FACETS = ...

def perms(index, facet, **kwargs):
    class Perm():
        def can(self):
            return True
    return Perm()

RECORDS_REST_FACETS = {
    'records-record-v1.0.0': {
        'aggs': translate_facets(FACETS, permissions=perms)
    },
}
```


  [image]: https://img.shields.io/github/license/oarepo/oarepo-ui.svg
  [1]: https://github.com/oarepo/oarepo-ui/blob/master/LICENSE
  [2]: https://img.shields.io/travis/oarepo/oarepo-ui.svg
  [3]: https://travis-ci.org/oarepo/oarepo-ui
  [4]: https://img.shields.io/coveralls/oarepo/oarepo-ui.svg
  [5]: https://coveralls.io/r/oarepo/oarepo-ui
  [6]: https://img.shields.io/pypi/v/oarepo-ui.svg
  [7]: https://pypi.org/pypi/oarepo-ui