// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import clsx from 'clsx'
import * as React from 'react'
import { Icon, Message } from 'semantic-ui-react'

/**
 * An error message to be shown.
 */
const ErrorMessage = ({ component, content, children, className, ...rest }) => {
  // @ts-ignore 2786 until Semantic-UI fully compatible with React 18
  return (
    <Message
      size="tiny"
      icon
      negative
      compact
      floating
      className={clsx(className, 'oarepo-error')}
      {...(content && !children && { content })}
      {...rest}
    >
      {/* @ts-ignore 2786 */}
      <Icon name="warning sign" />
      <Message.Header>Error rendering {component}:&nbsp;</Message.Header>
      <Message.Content>{children}</Message.Content>
    </Message>
  )
}

export default ErrorMessage
