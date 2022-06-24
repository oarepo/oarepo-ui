// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { useDataContext, useSeparator } from '../../hooks'
import { LayoutFragment } from '../../GeneratedLayout'

/**
 * Component rendering its children items in a flexbox row.
 * Items can optionally be separated by a separator component.
 */
const DividedRow = ({ config, data }) => {
  const {
    component,
    items,
    item,
    dataField,
    separator = { component: 'separator' },
    ...rest
  } = config

  const dataContext = useDataContext(data, dataField)
  const itemsData = dataField && dataContext != null ? dataContext : items

  const rowChildren = itemsData.flatMap((rowItem, index) =>
    index > 0 ? [useSeparator(separator), rowItem] : rowItem,
  )

  return LayoutFragment({
    config: {
      component: 'row',
      children: rowChildren,
      ...rest,
    },
    data: dataContext,
  })
}

DividedRow.prototype.takesArray = true

export default DividedRow
