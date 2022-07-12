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
import { useChildrenOrValue } from '@js/oarepo_generated_ui'

/**
 * Longer text that will be displayed truncated, with an option to show more.
 */
const TruncatedText = ({
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
  const [expanded, setExpanded] = React.useState(false)

  function toggleExpanded(e) {
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

  const truncatedClass = clsx('oarepo', 'oarepo-truncated-text', className)

  return (
    <Overridable id={buildUID('TruncatedText', '', 'oarepo_ui')}>
      (expanded && (
      <p className={truncatedClass} style={style} {...rest}>
        {useChildrenOrValue(children, data, useGlobalData)}
        {ExpandToggle}
      </p>
      )) || (
      <TextTruncate
        className={truncatedClass}
        style={style}
        line={lines}
        truncateText={ellipsis}
        text={useChildrenOrValue(children, data, useGlobalData)}
        textTruncateChild={ExpandToggle}
        {...rest}
      />
      )
    </Overridable>
  )
}

TruncatedText.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node,
  lines: PropTypes.number,
  ellipsis: PropTypes.string,
  expandToggle: PropTypes.object,
}

export default Overridable.component('TruncatedText', TruncatedText)
