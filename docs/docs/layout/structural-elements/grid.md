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

- `columns`: number of rendered Grid columns

:::tip Full Docs

[Semantic-UI Grid docs](https://semantic-ui.com/collections/grid.html#/definition)

:::

## Data

:::info Data rendering

Doesn't directly render any data referenced by `data` path.

:::

## Example

### Container grid with a fixed number of columns

```json title=layout.json5
{
  "component": "grid",
  "columns": 2,
  "columns": [
    {
        "component": "placeholder",
    },
    {
        "component": "placeholder",
    },
    {
        "component": "placeholder",
    },
    {
        "component": "placeholder",
    }
  ]
}
```

### Grid with rows

```json title=layout.json5
{
  "component": "grid",
  "rows": [
    {
      "className": "odd",
      "columns": [
        {
          "component": "placeholder",
        },
        {
          "component": "placeholder",
        }
      ]
    }
  ]
}
```
