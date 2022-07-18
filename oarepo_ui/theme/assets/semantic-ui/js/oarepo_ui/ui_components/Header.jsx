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

/**
 * A Semantic-UI header.
 */
const Header = ({
  data,
  useGlobalData,
  className,
  children,
  style,
  element,
}) => {
  const HeaderComponent = withDataArray(
    ({ children: _children, data: _data, useGlobalData: _useGlobalData }) => (
      <SemanticHeader
        {...(element && { as: element })}
        className={clsx('oarepo', 'oarepo-header', className)}
        style={style}
      >
        {useChildrenOrValue(_children, _data, _useGlobalData)}
      </SemanticHeader>
    ),
  )
  return (
    <Overridable id={buildUID('Header', '', 'oarepo_ui')}>
      <HeaderComponent {...{ children, data, useGlobalData }} />
    </Overridable>
  )
}

Header.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node,
}

export default Overridable.component('Header', Header)
