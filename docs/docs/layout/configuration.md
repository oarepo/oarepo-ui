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

    // Properties passed as component props.
    "props": {
      "className": "list of html classes",
      "style": "html style element, prefer 'classes'"
      // Other properties accepted by the component.
    },
    // Describes how individual list items should be rendered
    // (useful for list-based components where data needs to be rendered as list of items).
    "item": {/* CDB */}
    // Description of component's children (useful for container-based components).
    "items": [
      //{/* CDB */},
      //{/* CDB */},
      //...
    ]
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
