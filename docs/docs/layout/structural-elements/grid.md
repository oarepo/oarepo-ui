---
sidebar_position: 1
---

# Grid

`component: 'grid'`

:::note Implementation state:

- **jinja2**: Not implemented yet
- **react**: Not implemented yet

:::

A [Semantic-UI Grid](https://semantic-ui.com/collections/grid.html#/definition) container element. It expects its children items to be either `column` or `row` elements (if `props.rows` is used)

## Properties

Accepts one of the following `props`:

- `rows`: number of rendered Grid rows
- `columns`: number of rendered Grid columns

:::tip Full Docs

[Semantic-UI Grid docs](https://semantic-ui.com/collections/grid.html#/definition)

:::

## Data

:::info Data rendering

Doesn't directly render any data referenced by `data` path.

:::

## Example

```json title=layout.json5
{
  "component": "grid",
  "props": {
    "columns": 2
  },
  "items": [
    {
      "component": "column",
      "items": [
        // {/* CDB */}
      ]
    },
    {
      "component": "column"
      "items": [
        // {/* CDB */}
      ]
    }
  ]
}
```
