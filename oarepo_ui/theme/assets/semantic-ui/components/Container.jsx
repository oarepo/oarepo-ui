// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { useDataContext } from '../../hooks'
import { Container as SemanticContainer } from 'semantic-ui-react'

/**
 * A Semantic-UI container
 */
const Container = ({ config, data }) => {
  const { component, dataField, children, ...rest } = config

  const resolvedChildren =
    dataField && data ? useDataContext(data, dataField) : children

  return <SemanticContainer {...rest}>{resolvedChildren}</SemanticContainer>
}

export default Container
