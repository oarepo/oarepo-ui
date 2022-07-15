// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { useChildrenOrValue } from '@js/oarepo_generated_ui'
import { buildUID } from '../util'

/**
 * A a HTML element
 */
const Link = ({
  data,
  useGlobalData,
  className,
  style,
  children,
  href,
  ...rest
}) => {
  return (
    <Overridable id={buildUID('Link', '', 'oarepo_ui')}>
      <a
        href={href || data}
        className={clsx('oarepo', 'oarepo-link', className)}
        style={style}
        {...rest}
      >
        {useChildrenOrValue(children, undefined, useGlobalData)}
      </a>
    </Overridable>
  )
}

Link.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node,
  href: PropTypes.string,
}

export default Overridable.component('Link', Link)
