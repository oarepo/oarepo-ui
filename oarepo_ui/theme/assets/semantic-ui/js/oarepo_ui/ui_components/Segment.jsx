// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { useDataContext } from '../../hooks'
import { Segment as SemanticSegment } from 'semantic-ui-react'

/**
 * A Semantic-UI segment
 */
const Segment = ({ config, data }) => {
  const { component, dataField, children, ...rest } = config

  const resolvedChildren =
    dataField && data ? useDataContext(data, dataField) : children

  return <SemanticSegment {...rest}>{resolvedChildren}</SemanticSegment>
}

export default Segment
