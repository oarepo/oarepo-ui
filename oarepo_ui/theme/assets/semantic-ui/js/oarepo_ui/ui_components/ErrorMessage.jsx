// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { Icon, Message } from 'semantic-ui-react'
import { buildUID } from '../util'
import { useChildrenOrValue } from '@js/oarepo_generated_ui'

/**
 * An error message to be shown.
 */
const ErrorMessage = ({
  layout,
  data,
  useGlobalData,
  className,
  style,
  children,
}) => {
  return (
    <Overridable id={buildUID('ErrorMessage', '', 'oarepo_ui')}>
      <Message
        size="tiny"
        icon
        negative
        compact
        floating
        className={clsx('oarepo', 'oarepo-error', className)}
        style={style}
      >
        <Icon name="warning sign" />
        <Message.Header>Error rendering {layout.component}:</Message.Header>
        <Message.Content>
          {useChildrenOrValue(children, data, useGlobalData)}
        </Message.Content>
      </Message>
    </Overridable>
  )
}

ErrorMessage.propTypes = {
  layout: PropTypes.object.isRequired,
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.node,
}

export default Overridable.component('ErrorMessage', ErrorMessage)
