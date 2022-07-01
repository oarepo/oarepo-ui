// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import _isString from 'lodash/isString'

/**
 * Component rendering its children items in a flexbox row.
 * Items can optionally be separated by a separator component.
 */
const DividedRow = ({
  layout,
  data,
  record,
  className,
  style,
  items = [],
  separator = ', ',
}) => {
  const rowItems = items.map((item) => {
    if (_isString(item)) {
      return <React.Fragment>{item}</React.Fragment>
    }
    return useLayout({ layout: item, data: data, useGlobalData: useGlobalData })
  })

  return rowItems.flatMap((item, index) =>
    index > 0 && separator ? [useSeparator(separator), item] : item,
  )
}

DividedRow.prototype.takesArray = true

export default DividedRow
