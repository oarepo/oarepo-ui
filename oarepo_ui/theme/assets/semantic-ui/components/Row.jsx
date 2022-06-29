// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { Grid } from 'semantic-ui-react'
import { ColumnWrapper } from '../Column/Column'
import { ErrorMessage } from '../..'
import { LayoutFragment } from '../../GeneratedLayout'
import { useArrayDataContext, useDataContext, useItems } from '../../hooks'

export const RowWrapper = ({ config, data }) => {
  const { component, stretched = true, ...rest } = config
  return LayoutFragment({
    config: {
      component:
        component == undefined || component !== 'row' ? 'row' : component,
      stretched,
      ...rest,
    },
    data,
  })
}

/**
 * Component rendering its children items in a flexbox row.
 * Items can optionally be separated by a separator component.
 */
const Row = ({ config, data }) => {
  const {
    component,
    columns,
    columnsPerRow,
    children,
    dataField,
    items,
    item = { component: 'span' },
    ...rest
  } = config

  if (
    (children?.length && columns?.length) ||
    (children?.length && items?.length) ||
    (columns?.length && items?.length)
  ) {
    return (
      <ErrorMessage component={component} {...rest}>
        Only one of 'children', 'columns' or 'items' could be specified.
      </ErrorMessage>
    )
  }

  const dataContext = useDataContext(data, dataField)
  const dataItems =
    dataField && dataContext != null ? dataContext : items || children

  const Items = useItems(dataItems, item)?.map((rowItem, index) =>
    LayoutFragment({
      config: { key: index, ...rowItem },
      data: useArrayDataContext(dataContext, dataItems, index),
    }),
  )

  const Columns = columns?.map((columnConfig, index) => (
    <ColumnWrapper
      key={index}
      {...{
        config: columnConfig,
        data: useArrayDataContext(dataContext, columns, index),
      }}
    />
  ))

  return (
    <Grid.Row columns={columnsPerRow || columns?.length} {...rest}>
      {Items?.length && Items}
      {Columns?.length && Columns}
    </Grid.Row>
  )
}

Row.propTypes = {}

export default Overridable.component('Row', Row)
