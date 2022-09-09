// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { useLayout } from '@js/oarepo_generated_ui'
import clsx from 'clsx'
import { buildUID } from '../util'

const RowComponent = ({
  row,
  data,
  useGlobalData,
  columnsPerRow,
  className,
  style,
}) =>
  useLayout({
    layout: {
      ...row,
      component: 'row',
    },
    columns: [row],
    data,
    useGlobalData,
    columnsPerRow,
    className: clsx('stretched', className),
    style,
  })

const WrappedRowComponent = ({
  item,
  data,
  useGlobalData,
  columnsPerRow,
  className,
  style,
}) =>
  useLayout({
    layout: { component: 'row' },
    columns: [item],
    data,
    useGlobalData,
    columnsPerRow,
    className: clsx('stretched', className),
    style,
  })

/**
 * A component wrapping the layout inside a row component
 */
export const RowWrapper = ({
  data,
  useGlobalData = false,
  className,
  style,
  row,
  columnsPerRow,
}) => {
  const wrappedRow =
    !row.component || row.component === 'row' ? (
      <RowComponent
        {...{ row, data, useGlobalData, columnsPerRow, className, style }}
      />
    ) : (
      <WrappedRowComponent
        {...{ item: row, data, useGlobalData, columnsPerRow, className, style }}
      />
    )
  return (
    <Overridable id={buildUID('RowWrapper', '', 'oarepo_ui')}>
      {wrappedRow}
    </Overridable>
  )
}

RowWrapper.propTypes = {
  layout: PropTypes.object.isRequired,
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  row: PropTypes.object,
  columnsPerRow: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

export default Overridable.component('RowWrapper', RowWrapper)
