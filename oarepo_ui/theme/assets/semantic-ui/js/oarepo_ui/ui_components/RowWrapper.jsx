// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { Grid } from 'semantic-ui-react'
import { useLayout } from '@js/oarepo_generative_ui'
import clsx from 'clsx'
import { buildUID } from '../util'

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
  const RowComponent =
    !row.component || row.component === 'row'
      ? useLayout({
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
      : useLayout({
          layout: { component: 'row' },
          columns: [row],
          data,
          useGlobalData,
          columnsPerRow,
          className: clsx('stretched', className),
          style,
        })
  return (
    <Overridable id={buildUID('RowWrapper', '', 'oarepo_ui')}>
      {RowComponent}
    </Overridable>
  )
}

RowWrapper.propTypes = {
  layout: PropTypes.object.isRequired,
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.any(PropTypes.string, PropTypes.object),
  row: PropTypes.object,
  columnsPerRow: PropTypes.any(PropTypes.string, PropTypes.number),
}

export default Overridable.component('RowWrapper', RowWrapper)
