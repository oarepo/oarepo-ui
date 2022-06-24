// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { Label as SemanticLabel } from 'semantic-ui-react'
import { useDataContext } from '../../hooks'

/**
 * A Semantic-UI Label.
 */
const Label = ({ config, data }) => {
  const { component, dataField, content, ...rest } = config

  const resolvedContent =
    dataField && data ? useDataContext(data, dataField) : content

  // @ts-ignore until Semantic-UI supports React 18
  return <SemanticLabel content={resolvedContent} {...rest} />
}

export default Label
