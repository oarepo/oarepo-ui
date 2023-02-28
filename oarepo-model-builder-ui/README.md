<!--
 Copyright (c) 2022 CESNET

 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

# OARepo UI MODEL BUILDER

An [OARepo Model Builder](https://github.com/oarepo/oarepo-model-builder) plugin to generate
user interface layout from model specification.

## Usage

UI specification is written using the `oarepo:ui` element within the model specification file.
The generated layouts are stored in the ui folder in the layout.json file.

### Generic ui specification

Inside the generic `oarepo:ui` element, which is placed outside the metadata model
specification, the layouts used inside the modeled repository instance are defined.
Within the layouts it is said how the individual user interface elements are positioned to each other.

The elements are addressed by their metadata field names. If the element
is nested, it must be addressed using dot notation.
For example, if there is an "author" field which is object, has "fn" and "ln" fields, and only the "ln" field
should be used inside the layout, it will be addressed as "author.ln"

#### Structure

```json5
{
  'model': {},
  'oarepo:ui': {
    'layout_name': {
      'component': 'name_of_the_main_component',
      'items': [
        'element1',
        'element2'
      ]
    },
    'different_layout_name': {
      'component': 'name_of_the_main_component',
      'columns': [
        {
          'component': 'name_of_the_nested_component',
          'items': [
            'element1',
            'element2'
          ]
        },
        'element3.element4'
      ]
    }
  }
}
```

### Inside filed specifications

Elements used inside the generic ui specification must have their own `oarepo:ui` element inside their model
specification.

#### Objects

Objects and arrays must have on their top level specified which of their nested elements will be used inside ui
layout and how (similar to the generic specification, which is describe above)

#### Default layout

UI specification placed under the "default" layout will be applied for every layout where is the element mentioned and
for which it does not have specification.

#### Structure

```json5
{
  'model': {
    'properties': {
      'metadata': {
        'el1': {
          'oarepo:ui': {
            'layout_name': {
              'component': 'name_of_the_component',
              'dataField': 'el1'
            }
          }
        },
        'el2': {
          'type': 'object',
          'properties': {
            'el3': {
              'layout_name': {
                'component': 'name_of_the_component',
                'dataField': 'el3'
              }
            }
          },
          'oarepo:ui': {
            'layout_name': {
              component: 'name_of_the_component',
              'items': [
                'el3'
              ]
            }
          }
        }
      }
    }
  }
}
```

For a non-nested element, it is possible to leave the field `dataField empty`, as it will be filled automatically with
the name of the
element (only if it is not defined externally)

## Examples

### Specification

```json5
{
  'model': {
    'properties': {
      'metadata': {
        'properties': {
          'author': {
            'type': 'object',
            'properties': {
              'last_name': {
                'type': 'fulltext',
                'oarepo:ui': {
                  'detail': {
                    "component": "raw",
                    "dataField": ""
                  },
                  'search': {
                    "component": "raw",
                    "dataField": ""
                  }
                }
              },
              'first_name': {
                'type': 'fulltext',
                'oarepo:ui': {
                  'default': {
                    "component": "raw",
                    "dataField": ""
                  }
                }
              }
            },
            'oarepo:ui': {
              'detail': {
                'component': 'row',
                'separator': '_',
                'columns': [
                  'first_name',
                  'last_name'
                ]
              },
              'search': {
                'component': 'column',
                'items': [
                  'last_name',
                  'first_name',
                ]
              }
            }
          },
          'title': {
            'type': 'fulltext',
            'minLength': 5,
            'oarepo:ui': {
              'detail': {
                'component': 'raw',
                'dataField': ""
              },
              'search': {
                'component': 'raw',
                'dataField': ""
              }
            }
          }
        }
      }
    }
  },
  'oarepo:sample': {
    'count': 50
  },
  'oarepo:ui': {
    'detail': {
      'component': 'column',
      'items': [
        {
          "component": "icon",
          "name": "thumbs up",
          "color": "green",
          "size": "large"
        },
        'author',
        'title'
      ]
    },
    'search': {
      'component': 'row',
      'columns': [
        {
          "component": "list",
          "name": "thumbs up",
          "color": "green",
          "size": "large"
        },
        'author.first_name',
        'title'
      ]
    }
  }
}

```

### Output

```json5
{
  'detail': {
    'component': 'column',
    'items': [
      {
        'component': 'icon',
        'name': 'thumbs up',
        'color': 'green',
        'size': 'large'
      },
      {
        'component': 'row',
        'separator': '_',
        'columns': [
          {
            'component': 'raw',
            'dataField': 'author.first_name'
          },
          {
            'component': 'raw',
            'dataField': 'author.last_name'
          }
        ]
      },
      {
        'component': 'raw',
        'dataField': 'title'
      }
    ]
  },
  'search': {
    'component': 'row',
    'columns': [
      {
        'component': 'list',
        'name': 'thumbs up',
        'color': 'green',
        'size': 'large'
      },
      {
        'component': 'raw',
        'dataField': 'author.first_name'
      },
      {
        'component': 'raw',
        'dataField': 'title'
      }
    ]
  }
}

```