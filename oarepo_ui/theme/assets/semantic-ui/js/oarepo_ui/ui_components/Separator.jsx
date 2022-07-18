// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { Label } from 'semantic-ui-react'
import clsx from 'clsx'
import { buildUID } from '../util'

/**
 * Simple item separator component.
 */
const Separator = ({
  data: _data,
  useGlobalData: _useGlobalData,
  className,
  style,
  color,
  double,
  ...rest
}) => {
  return (
    <Overridable id={buildUID('Separator', '', 'oarepo_ui')}>
      <Label
        basic
        className={clsx('oarepo', 'oarepo-separator', color, className)}
        style={style}
        {...rest}
      >
        {double ? '‖' : '❙'}
      </Label>
    </Overridable>
  )
}

Separator.propTypes = {
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  color: PropTypes.string,
  double: PropTypes.bool,
}

export default Overridable.component('Separator', Separator)
