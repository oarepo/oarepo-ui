// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import Overridable from 'react-overridable'
import PropTypes from 'prop-types'
import { buildUID } from '../util'
import { useLayout } from '@js/oarepo_generated_ui'

const ColumnComponent = ({ column, data, useGlobalData, className, style }) =>
  useLayout({
    layout: {
      ...column,
      component: 'column',
    },
    data,
    useGlobalData,
    className,
    style,
  })

const WrappedColumnComponent = ({
  item,
  data,
  useGlobalData,
  className,
  style,
}) =>
  useLayout({
    layout: { component: 'column' },
    items: [item],
    data,
    useGlobalData,
    className: clsx('stretched', className),
    style,
  })

/**
 * A component wrapping the layout inside a column component
 */
export const ColumnWrapper = ({
  data,
  useGlobalData,
  className,
  style,
  column,
}) => {
  const wrappedColumn =
    !column.component || column.component === 'column' ? (
      <ColumnComponent {...{ column, data, useGlobalData, className, style }} />
    ) : (
      <WrappedColumnComponent
        {...{ item: column, data, useGlobalData, className, style }}
      />
    )

  return (
    <Overridable id={buildUID('ColumnWrapper', '', 'oarepo_ui')}>
      {wrappedColumn}
    </Overridable>
  )
}

ColumnWrapper.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  column: PropTypes.object,
}

export default Overridable.component('ColumnWrapper', ColumnWrapper)
