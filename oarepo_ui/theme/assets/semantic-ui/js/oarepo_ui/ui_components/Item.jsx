// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import _isString from 'lodash/isString'
import * as React from 'react'
import { Item as SemanticItem } from 'semantic-ui-react'
import { LayoutFragment } from '../../GeneratedLayout'

const ItemHeader = (props) => {
  const { component, children, content, renderUIFragment, ...rest } = props
  return (
    <SemanticItem.Header
      {...rest}
      {...(content && {
        content: _isString(content)
          ? content
          : LayoutFragment({ config: content }),
      })}
    >
      {children?.map((child, index) =>
        LayoutFragment({ config: { ...child, key: index } }),
      )}
    </SemanticItem.Header>
  )
}

/**
 * TODO: WIP
 * An item view presents related collection of content for display.
 * See https://react.semantic-ui.com/views/item for available props.
 */
const Item = ({ config, data }) => {
  const { component, ...props } = config
  const {
    children,
    content,
    description,
    extra,
    header,
    image,
    meta,
    ...rest
  } = props

  return (
    <SemanticItem {...rest}>
      {header && <ItemHeader {...header} />}
      {children?.map((child, index) =>
        LayoutFragment({ config: { key: index, ...child }, data }),
      )}
    </SemanticItem>
  )
}

export default Item
