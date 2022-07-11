// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import Overridable from 'react-overridable'
import PropTypes from 'prop-types'
import { List as SemanticList } from 'semantic-ui-react'
import { useLayout } from '@js/oarepo_generated_ui'
import { SeparatorComponent } from '@uijs/oarepo_generated_ui'
import _isString from 'lodash/isString'
import { buildUID } from '../util'

const ListItemComponent = ({ item, data, useGlobalData }) => {
  return useLayout({ layout: item, data, useGlobalData })
}

/**
 * Component putting its children items into a List.
 * See https://react.semantic-ui.com/elements/list for available props.
 */
const List = ({
  data,
  useGlobalData,
  className,
  style,
  horizontal = false,
  item = { component: 'raw' },
  separator,
  ...rest
}) => {
  const listItems = data.map((itemData, index) => (
    <SemanticList.Item
      className={clsx('oarepo', {
        'oarepo-separated': separator,
        'oarepo-separated-text':
          _isString(separator) && separator?.endsWith(' '),
      })}
    >
      {index > 0 && separator && <SeparatorComponent component={separator} />}
      <ListItemComponent
        item={item}
        data={itemData}
        useGlobalData={useGlobalData}
      />
    </SemanticList.Item>
  ))

  return (
    <Overridable id={buildUID('List', '', 'oarepo_ui')}>
      <SemanticList
        className={clsx('oarepo', 'oarepo-list', className)}
        style={style}
        horizontal={horizontal}
        {...rest}
      >
        {listItems}
      </SemanticList>
    </Overridable>
  )
}

List.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.any(PropTypes.string, PropTypes.object),
  horizontal: PropTypes.bool,
  item: PropTypes.object,
  separator: PropTypes.any(PropTypes.string, PropTypes.object),
}

List.prototype.takesArray = true

export default Overridable.component('List', List)
