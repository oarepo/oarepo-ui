// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { Header as SemanticHeader } from 'semantic-ui-react'
import { useDataContext } from '../../hooks'

/**
 * A Semantic-UI header.
 */
const Header = ({ config, data }) => {
  const { component, dataField, content, ...rest } = config

  const resolvedContent =
    dataField && data ? useDataContext(data, dataField) : content

  // @ts-ignore until Semantic-UI supports React 18
  return <SemanticHeader content={resolvedContent} {...rest} />
}

export default Header
