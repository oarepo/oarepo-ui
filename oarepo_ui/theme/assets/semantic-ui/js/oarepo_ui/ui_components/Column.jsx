// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import Overridable from 'react-overridable'
import PropTypes from 'prop-types'
import { Grid } from 'semantic-ui-react'
import { useLayout } from '@js/oarepo_generated_ui'
import { buildUID } from '../util'

const ColumnItem = ({ item, data, useGlobalData }) =>
  useLayout({
    layout: item,
    data,
    useGlobalData,
  })

/**
 * Component putting its children items into a single responsive column.
 * See https://react.semantic-ui.com/collections/grid/#Grid.Column for available props.
 */
const Column = ({ data, useGlobalData, className, style, items = [] }) => {
  const ColumnItems = items?.map((item, idx) => (
    <ColumnItem
      item={item}
      data={data}
      key={idx}
      useGlobalData={useGlobalData}
    />
  ))

  return (
    <Overridable id={buildUID('Column', '', 'oarepo_ui')}>
      <Grid.Column
        className={clsx('oarepo', 'oarepo-column', className)}
        style={style}
      >
        {ColumnItems}
      </Grid.Column>
    </Overridable>
  )
}

Column.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  items: PropTypes.array,
}

export default Overridable.component('Column', Column)
