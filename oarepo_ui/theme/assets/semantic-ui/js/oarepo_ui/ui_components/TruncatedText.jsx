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
import { withDataArray } from '@uijs/oarepo_generated_ui/ui_components'

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
  const truncatedClass = clsx('oarepo', 'oarepo-truncated-text', className)

  const TruncatedTextComponent = withDataArray(
    ({ children: _children, data: _data, useGlobalData: _useGlobalData }) => {
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

      console.log('tt', useChildrenOrValue(_children, _data, _useGlobalData))

      return (
        (expanded && (
          <p className={truncatedClass} style={style} {...rest}>
            {_data}
            {ExpandToggle}
          </p>
        )) || (
          <TextTruncate
            className={truncatedClass}
            style={style}
            line={lines}
            truncateText={ellipsis}
            text={_data}
            textTruncateChild={ExpandToggle}
            {...rest}
          />
        )
      )
    },
  )

  return (
    <Overridable id={buildUID('TruncatedText', '', 'oarepo_ui')}>
      <TruncatedTextComponent {...{ children, data, useGlobalData }} />
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
