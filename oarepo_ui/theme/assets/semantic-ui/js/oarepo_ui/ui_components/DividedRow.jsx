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
import { useLayout } from '@js/oarepo_generated_ui'
import { SeparatorComponent } from '@uijs/oarepo_generated_ui/ui_components'

const RowItem = ({ item, data, useGlobalData, ...rest }) =>
  useLayout({
    layout: item,
    data: data,
    useGlobalData: useGlobalData,
    ...rest,
  })

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
  ...rest
}) => {
  const rowItems = items.map((item, idx) => {
    if (_isString(item)) {
      return <React.Fragment key={idx}>{item}</React.Fragment>
    }
    return (
      <RowItem
        key={idx}
        item={item}
        data={data}
        useGlobalData={useGlobalData}
      />
    )
  })
  const separatedItems = rowItems.flatMap((item, idx) =>
    idx > 0 && separator
      ? [<SeparatorComponent key={`sep-${idx}`} component={separator} />, item]
      : item,
  )

  return (
    <Overridable id={buildUID('DividedRow', '', 'oarepo_ui')}>
      <Grid.Row
        className={clsx('oarepo', 'oarepo-divided-row', className)}
        style={style}
        {...rest}
      >
        {separatedItems}
      </Grid.Row>
    </Overridable>
  )
}

DividedRow.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  items: PropTypes.array,
  separator: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
}

export default Overridable.component('DividedRow', DividedRow)
