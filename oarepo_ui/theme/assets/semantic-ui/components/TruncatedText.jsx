// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { useDataContext } from '../../hooks'
import TextTruncate from 'react-text-truncate'
import { LayoutFragment } from '../../GeneratedLayout'
import clsx from 'clsx'

/**
 * Longer text that will be displayed truncated, with an option to show more.
 */
const TruncatedText = ({ config, data }) => {
  const [expanded, setExpanded] = React.useState(false)

  const {
    component,
    dataField,
    text,
    lines = 1,
    ellipsis = '…',
    expandToggle = {
      component: 'link',
      href: '#',
      children: `> Show ${!expanded ? 'more' : 'less'}`,
    },
    ...rest
  } = config

  const resolvedText =
    dataField && data ? useDataContext(data, dataField) : text?.toString()

  const toggleExpanded = (e) => {
    e.preventDefault()
    setExpanded(!expanded)
  }

  const ExpandToggle = LayoutFragment({
    config: {
      ...expandToggle,
      className: clsx('oarepo-expand-toggle', expandToggle.className),
      onClick: (e) => toggleExpanded(e),
      expanded,
    },
    data,
  })

  return (
    (expanded && (
      <p>
        {resolvedText}
        {ExpandToggle}
      </p>
    )) || (
      <TextTruncate
        line={lines}
        truncateText={ellipsis}
        text={resolvedText}
        textTruncateChild={ExpandToggle}
        {...rest}
      />
    )
  )
}

export default TruncatedText
