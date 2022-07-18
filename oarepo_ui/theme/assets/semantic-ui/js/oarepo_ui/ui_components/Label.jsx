// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { Label as SemanticLabel } from 'semantic-ui-react'
import { buildUID } from '../util'
import { useChildrenOrValue } from '@js/oarepo_generated_ui'

/**
 * A Semantic-UI Label.
 */
const Label = ({
  data,
  useGlobalData,
  className,
  style,
  children,
  ...rest
}) => {
  return (
    <Overridable id={buildUID('Label', '', 'oarepo_ui')}>
      <SemanticLabel
        as="button"
        className={clsx('oarepo', 'oarepo-label', className)}
        style={style}
        {...rest}
      >
        {useChildrenOrValue(children, data, useGlobalData)}
      </SemanticLabel>
    </Overridable>
  )
}

Label.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node,
}

export default Overridable.component('Label', Label)
