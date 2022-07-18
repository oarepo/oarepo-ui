// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { Header as SemanticHeader } from 'semantic-ui-react'
import { buildUID } from '../util'
import { useChildrenOrValue } from '@js/oarepo_generated_ui'
import { withDataArray } from '@uijs/oarepo_generated_ui/ui_components'

const Header = ({
  children,
  data,
  className,
  style,
  element,
  useGlobalData,
}) => (
  <SemanticHeader
    {...(element && { as: element })}
    className={clsx('oarepo', 'oarepo-header', className)}
    style={style}
  >
    {useChildrenOrValue(children, data, useGlobalData)}
  </SemanticHeader>
)

/**
 * A Semantic-UI header.
 */
const HeaderArray = ({
  data,
  useGlobalData,
  className,
  children,
  style,
  element,
}) => {
  const HeaderComponent = withDataArray(Header)
  return (
    <Overridable id={buildUID('Header', '', 'oarepo_ui')}>
      <HeaderComponent
        {...{ children, data, useGlobalData, className, style, element }}
      />
    </Overridable>
  )
}

HeaderArray.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node,
}

export default Overridable.component('Header', HeaderArray)
