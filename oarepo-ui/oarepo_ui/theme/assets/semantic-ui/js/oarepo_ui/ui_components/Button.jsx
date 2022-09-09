// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { Button as SemanticButton } from 'semantic-ui-react'
import { useChildrenOrValue } from '@js/oarepo_generated_ui'
import { buildUID } from '../util'

/**
 * A Semantic-UI button element
 */
const Button = ({ data, useGlobalData, className, style, children }) => {
  return (
    // @ts-ignore until Semantic-UI supports React 18
    <Overridable id={buildUID('Button', '', 'oarepo_ui')}>
      <SemanticButton
        className={clsx('oarepo', 'oarepo-button', className)}
        style={style}
      >
        {useChildrenOrValue(children, data, useGlobalData)}
      </SemanticButton>
    </Overridable>
  )
}

Button.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node,
}

export default Overridable.component('Button', Button)
