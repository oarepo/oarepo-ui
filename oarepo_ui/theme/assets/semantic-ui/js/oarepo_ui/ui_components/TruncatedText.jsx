// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import TextTruncate from 'react-text-truncate'
import { buildUID } from '../util'
import { useLayout } from '@js/oarepo_generated_ui'
import clsx from 'clsx'
import { withDataArray } from '@uijs/oarepo_generated_ui/ui_components'

const TruncatedText = ({
  children,
  data,
  lines,
  ellipsis,
  style,
  useGlobalData,
  expandToggle,
  ...rest
}) => {
  const [expanded, setExpanded] = React.useState(false)
  const toggleExpanded = (e) => {
    e.preventDefault()
    setExpanded(!expanded)
  }
  const ExpandToggle = useLayout({
    ...expandToggle,
    className: clsx('oarepo-expand-toggle', expandToggle.className),
    onClick: (e) => toggleExpanded(e),
    children: expandToggle.children(expanded),
    data,
    useGlobalData,
  })

  return (
    (expanded && (
      <p style={style} {...rest}>
        {data}
        {ExpandToggle}
      </p>
    )) || (
      <TextTruncate
        line={lines}
        truncateText={ellipsis}
        text={data}
        textTruncateChild={ExpandToggle}
        {...rest}
      />
    )
  )
}

/**
 * Longer text that will be displayed truncated, with an option to show more.
 */
const TruncatedTextArray = ({
  data,
  useGlobalData,
  className,
  style,
  children,
  lines = 1,
  ellipsis = '…',
  expandToggle = {
    layout: { component: 'link' },
    href: '#',
    children: (state) => `> Show ${!state ? 'more' : 'less'}`,
  },
  ...rest
}) => {
  const truncatedClass = clsx('oarepo', 'oarepo-truncated-text', className)

  const TruncatedTextComponent = withDataArray(TruncatedText)

  return (
    <Overridable id={buildUID('TruncatedText', '', 'oarepo_ui')}>
      <TruncatedTextComponent
        {...{
          children,
          data,
          useGlobalData,
          className: truncatedClass,
          expandToggle,
          style,
          lines,
          ellipsis,
          ...rest,
        }}
      />
    </Overridable>
  )
}

TruncatedTextArray.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node,
  lines: PropTypes.number,
  ellipsis: PropTypes.string,
  expandToggle: PropTypes.object,
}

export default Overridable.component('TruncatedText', TruncatedTextArray)
