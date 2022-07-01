// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { Button as SemanticButton } from 'semantic-ui-react'

/**
 * A Semantic-UI button element
 */
const Button = ({ layout, data, record }) => {
  const { component, dataField, children, ...rest } = config

  const children = useChildrenOrValue(layout, data, record, children)

  return (
    // @ts-ignore until Semantic-UI supports React 18
    <SemanticButton {...rest}>{children}</SemanticButton>
  )
}

export default Button
