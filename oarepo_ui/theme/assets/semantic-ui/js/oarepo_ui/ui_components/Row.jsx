// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { Grid } from 'semantic-ui-react'
import { useLayout } from '@js/oarepo_generated_ui'
import clsx from 'clsx'
import { buildUID } from '../util'

const RowColumn = ({ column, data, useGlobalData }) =>
  useLayout({
    layout: { component: 'column_wrapper' },
    column: column,
    data: data,
    useGlobalData: useGlobalData,
  })

/**
 * Component rendering its children items in a flexbox row.
 * Items can optionally be separated by a separator component.
 */
const Row = ({
  data,
  useGlobalData = false,
  className,
  columns,
  columnsPerRow,
  ...rest
}) => {
  return (
    <Overridable id={buildUID('Row', '', 'oarepo_ui')}>
      <Grid.Row
        columns={columnsPerRow || columns?.length}
        className={clsx('oarepo', 'oarepo-row', className)}
        {...rest}
      >
        {columns?.map((column, idx) => (
          <RowColumn
            key={idx}
            column={column}
            data={data}
            useGlobalData={useGlobalData}
          />
        ))}
      </Grid.Row>
    </Overridable>
  )
}

Row.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  columns: PropTypes.array,
  columnsPerRow: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

export default Overridable.component('Row', Row)
