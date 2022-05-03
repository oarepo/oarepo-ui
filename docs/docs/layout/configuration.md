---
sidebar_position: 1
---

# Configuration

We can define, how an API data will be rendered in UI using one or more JSON layout configuration files.

## Layout definition

An UI layout is defined as a JSON object describing how the data are laid
out on the web page. The layout file might either be generated automatically
by [oarepo-model-builder](https://github.com/oarepo/oarepo-model-builder) or written by hand.

A layout definition file consists of a list of **Component definition block (CDB)**, which can
be nested at multiple levels:

```json title=layout.json5
[
  {
    /* Component definition block */

    // The component that renders the part of the layout.
    "component": "<component name>",

    // Jsonpath reference to the data that the component should render
    // (actual data is to be provided separately in the UI render context).
    "data": "<dotted_path_to_data>",

    "className": "list of html classes",
    "style": "html style element, prefer 'classes'",

    // Properties passed as component props.
    "props": {
      // Extra props for the component, jinja or react specific
    },
  }
  //{/* CDB */}
  //...
]
```

## Example

```json title=layout.json5
[
  {
    "component": "row",
    "items": [
      {
        "component": "label",
        "data": "value1.label"
      },
      {
        "component": "label",
        "data": "value2.label"
      }
    ]
  }
]
```
