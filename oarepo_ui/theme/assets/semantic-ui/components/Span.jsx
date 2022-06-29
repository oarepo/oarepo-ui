// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { useDataContext } from '../../hooks'

/**
 * A span HTML element
 */
const Span = ({ config, data }) => {
  const { component, dataField, children, ...rest } = config

  const dataContext = useDataContext(data, dataField)
  const resolvedChildren =
    dataField && dataContext != null ? dataContext : children
  return <span {...rest}>{resolvedChildren}</span>
}

export default Span
