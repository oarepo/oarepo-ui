// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import React, { FC } from 'react'
import { Grid as SemanticGrid } from 'semantic-ui-react'
import { RowWrapper } from './Row'
import { ColumnWrapper } from './Column'
import { ErrorMessage } from '..'
import { useArrayDataContext, useDataContext } from '../../hooks'

/**
 * Component putting its children items into separate columns.
 * See https://react.semantic-ui.com/collections/grid/ for available props.
 */
const Grid = ({ config, data }) => {
  const {
    component,
    columnsPerRow = 'equal',
    container = true,
    columns,
    dataField,
    rows,
    key,
    ...rest
  } = config

  const dataContext = useDataContext(data, dataField)

  const Columns = columns?.map((column, columnIndex) => (
    <ColumnWrapper
      {...{
        key: columnIndex,
        config: column,
        data: useArrayDataContext(dataContext, columns, columnIndex),
      }}
    />
  ))

  const Rows = rows?.map((row, rowIndex) => (
    <RowWrapper
      {...{
        key: rowIndex,
        config: row,
        data: useArrayDataContext(dataContext, rows, rowIndex),
      }}
    />
  ))

  if (Columns?.length) {
    return (
      <SemanticGrid
        key={key}
        container={container}
        columns={columnsPerRow}
        {...rest}
      >
        {Columns}
      </SemanticGrid>
    )
  } else if (Rows?.length) {
    return (
      <SemanticGrid key={key} container={container} {...rest}>
        {Rows}
      </SemanticGrid>
    )
  } else {
    return (
      <ErrorMessage key={key} component="grid">
        Expected either rows or columns
      </ErrorMessage>
    )
  }
}

export default Grid
