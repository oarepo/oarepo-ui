// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import Overridable from 'react-overridable'
import { Grid as SemanticGrid } from 'semantic-ui-react'
import { ErrorMessage } from '..'
import { buildUID } from '../util'

/**
 * Component putting its children items into separate columns.
 * See https://react.semantic-ui.com/collections/grid/ for available props.
 */
const Grid = ({
  layout,
  data,
  useGlobalData,
  className,
  style,
  rows,
  columns,
  columnsPerRow,
}) => {
  const Columns = columns?.map((column) =>
    useLayout({
      layout: { component: 'column-wrapper' },
      column,
      data,
      useGlobalData,
    }),
  )

  const Rows = rows?.map((row) =>
    useLayout({
      layout: { component: 'row-wrapper' },
      row,
      data,
      useGlobalData,
    }),
  )

  return (
    <Overridable id={buildUID('Grid', '', 'oarepo_ui')}>
      <SemanticGrid
        className={clsx('oarepo', 'oarepo-grid', className)}
        style={style}
        container={!rows}
        columns={columnsPerRow}
      >
        {(Rows?.length && { Rows }) || (Columns?.length && { Columns }) || (
          <ErrorMessage layout={{ component: 'grid' }}>
            Error rendering grid: either row or columns expected, got
            {JSON.stringify(layout)}
          </ErrorMessage>
        )}
      </SemanticGrid>
    </Overridable>
  )
}

export default Overridable.component('Grid', Grid)
