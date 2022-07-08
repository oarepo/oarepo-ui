// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import Overridable from 'react-overridable'
import PropTypes from 'prop-types'
import { buildUID } from '../util'

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
  const ColumnComponent =
    !column.component || column.component === 'column'
      ? useLayout({
          layout: {
            ...column,
            component: 'column',
          },
          data,
          useGlobalData,
          className,
          style,
        })
      : useLayout({
          layout: column,
          items: [column],
          data,
          useGlobalData,
          className: clsx('stretched', className),
          style,
        })

  return (
    <Overridable id={buildUID('ColumnWrapper', '', 'oarepo_ui')}>
      {ColumnComponent}
    </Overridable>
  )
}

ColumnWrapper.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.any(PropTypes.string, PropTypes.object),
  column: PropTypes.object,
}

export default Overridable.component('ColumnWrapper', ColumnWrapper)
