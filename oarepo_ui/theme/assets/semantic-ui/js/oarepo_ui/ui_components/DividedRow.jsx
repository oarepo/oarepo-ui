// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import _isString from 'lodash/isString'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { Grid } from 'semantic-ui-react'
import { buildUID } from '../util'

/**
 * Component rendering its children items in a flexbox row.
 * Items can optionally be separated by a separator component.
 */
const DividedRow = ({
  data,
  useGlobalData,
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

  const separatedItems = rowItems.flatMap((item, index) =>
    index > 0 && separator ? [useSeparator(separator), item] : item,
  )

  return (
    <Overridable id={buildUID('DividedRow', '', 'oarepo_ui')}>
      <Grid.Row
        className={clsx('oarepo', 'oarepo-divided-row', className)}
        style={style}
      >
        {separatedItems}
      </Grid.Row>
    </Overridable>
  )
}

DividedRow.prototype.takesArray = true

DividedRow.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.any(PropTypes.string, PropTypes.object),
  items: PropTypes.array,
  separator: PropTypes.any(PropTypes.string, PropTypes.object),
}

export default Overridable.component('DividedRow', DividedRow)
