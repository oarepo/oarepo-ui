// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { Icon as SemanticIcon, Image as SemanticImage } from 'semantic-ui-react'
import { buildUID } from '../util'
import _isString from 'lodash/isString'
import _isEmpty from 'lodash/isEmpty'

/**
 * An Icon, that renders either as a custom
 * SVG graphic or as a built-in Semantic-UI Icon.
 */
const Icon = ({
  data,
  useGlobalData: _useGlobalData,
  className,
  style,
  name,
  size = 'tiny',
  color = '',
  iconSet = {},
  src,
  ...rest
}) => {
  const value = src ? undefined : name || data
  const _getIcon = (iconName) => {
    return iconSet ? iconSet[iconName] : iconName
  }
  const iconData = _getIcon(value)

  const IconComponent = ({ icon }) => {
    const iconClass = clsx('oarepo', 'oarepo-icon', className)

    if (_isString(icon)) {
      return (
        <SemanticIcon
          className={iconClass}
          size={size}
          color={color}
          name={icon}
          style={style}
          {...rest}
        />
      )
    } else if (icon.name) {
      const {
        size: iconSize,
        color: iconColor,
        name: iconName,
        style: iconStyle,
        ...iconArgs
      } = icon
      return (
        <SemanticIcon
          className={iconClass}
          size={iconSize || size}
          color={iconColor || color}
          name={iconName}
          style={iconStyle || style}
          {...iconArgs}
          {...rest}
        />
      )
    } else if (!_isEmpty(icon)) {
      const { size: iconSize, color: iconColor, ...iconArgs } = icon
      return (
        <SemanticImage
          className={clsx(iconClass, 'oarepo-ui-image-icon')}
          size={iconSize || size}
          color={iconColor || color}
          {...iconArgs}
          {...rest}
        />
      )
    } else {
      return (
        <SemanticImage
          className={clsx(iconClass, 'oarepo-ui-image-icon')}
          size={size}
          color={color}
          src={src}
          {...rest}
        />
      )
    }
  }

  return (
    <Overridable id={buildUID('Icon', '', 'oarepo_ui')}>
      <IconComponent icon={iconData} />
    </Overridable>
  )
}

Icon.propTypes = {
  data: PropTypes.array,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  name: PropTypes.string,
  size: PropTypes.string,
  color: PropTypes.string,
  iconSet: PropTypes.object,
  src: PropTypes.string,
}

export default Overridable.component('Icon', Icon)
