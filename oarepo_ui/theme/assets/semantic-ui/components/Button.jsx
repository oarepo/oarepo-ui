// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { useDataContext } from '../../hooks'
import { Button as SemanticButton } from 'semantic-ui-react'

/**
 * A Semantic-UI button element
 */
const Button = ({ config, data }) => {
  const { component, dataField, children, ...rest } = config

  const resolvedChildren =
    dataField && data ? useDataContext(data, dataField) : children

  return (
    // @ts-ignore until Semantic-UI supports React 18
    <SemanticButton {...rest}>{resolvedChildren}</SemanticButton>
  )
}

export default Button
