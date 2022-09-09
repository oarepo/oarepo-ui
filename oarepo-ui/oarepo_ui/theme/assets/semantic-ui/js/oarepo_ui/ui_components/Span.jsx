// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { buildUID } from '../util'
import { useChildrenOrValue } from '@js/oarepo_generated_ui'
import { withDataArray } from '@uijs/oarepo_generated_ui/ui_components'

const SpanValue = ({
  children,
  data,
  useGlobalData,
  className,
  style,
  ...rest
}) => (
  <span
    className={clsx('oarepo', 'oarepo-span', className)}
    style={style}
    {...rest}
  >
    {useChildrenOrValue(children, data, useGlobalData)}
  </span>
)

/**
 * A span HTML element
 */
const Span = ({ data, useGlobalData, className, style, children, ...rest }) => {
  const SpanValues = withDataArray(SpanValue)

  return (
    <Overridable id={buildUID('Span', '', 'oarepo_ui')}>
      <SpanValues
        {...{ children, data, useGlobalData, className, style, ...rest }}
      />
    </Overridable>
  )
}

Span.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node,
}

export default Overridable.component('Span', Span)
