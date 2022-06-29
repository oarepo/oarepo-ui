// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import clsx from 'clsx'
import * as React from 'react'
import { List as SemanticList } from 'semantic-ui-react'
import { LayoutFragment } from '../../GeneratedLayout'
import { useDataContext, useItems, useSeparator } from '../../hooks'
import _isString from 'lodash/isString'

/**
 * Component putting its children items into a List.
 * See https://react.semantic-ui.com/elements/list for available props.
 */
const List = ({ config, data }) => {
  const {
    component,
    dataField,
    items,
    item = { component: 'span' },
    separator,
    ...rest
  } = config

  const dataContext = useDataContext(data, dataField)
  const itemsData = dataField && dataContext != null ? dataContext : items

  const listItems = useItems(itemsData, item)?.flatMap((listItem, index) =>
    index > 0 && separator ? [useSeparator(separator), listItem] : listItem,
  )

  const ListItems = listItems?.map((listItem, index) => (
    <SemanticList.Item
      className={clsx('oarepo', {
        'oarepo-separated': separator,
        'oarepo-separated-text': _isString(separator),
      })}
      key={index}
    >
      {LayoutFragment({ config: listItem })}
    </SemanticList.Item>
  ))

  return <SemanticList {...rest}>{ListItems}</SemanticList>
}

export default List
