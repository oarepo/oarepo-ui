# Layout primitives

This document summarizes layout primitives, their attributes, usage and examples.

## Usage

### Layout definition

A layout is JSON object describing how the data are presented on web page.
The layout might be generated automatically by `oarepo-model-builder` or
written by hand.

The overall structure of the layout is:

```json5
{
  // the component that renders this part of the layout
  component: "<component name>",
  
  // path to the data that the component renders
  data: "<dotted_path_to_data>",
  
  // properties passed into the component
  props: {
    className: "list of html classes",
    style: "html style element, prefer 'classes'",
    // other properties understood by the component
  },
  items: [
    // children of the component, if the component is a container.
    // have the same syntax as this example (recursive)
  ]
}
```

#### Example

TODO

### Structural elements

#### `grid`

A semantic-ui grid. It's children should be `column` elements (or `row` elements if `props.rows` are used)

* `component`: `grid`
* `data`: usually empty, but might contain a path to container within data
* `props`:
  * `rows`: if set to true, generate a grid without container, that is a grid that contains
    explicit rows. If set to false (default), generate a responsive grid.
  * `classes`: any classes that grid takes, for example `equal width center aligned padded`.
    They will be inserted between `ui` and `grid (container)`.

Implementation state:
  * detail: Not yet implemented
  * search: Not yet implemented

Example:



### Data elements

## Writing components

See [layout_detail.md](./layout_detail.md) for writing components
for record detail page, [layout_search_result.md](./layout_search_result.md) 
for writing component for search result formatting. To customize the search page
as a whole, see [layout_search.md](./layout_search.md).
