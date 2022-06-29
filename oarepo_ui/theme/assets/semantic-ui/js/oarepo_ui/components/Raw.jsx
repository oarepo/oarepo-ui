// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { useDataContext } from '../../hooks'

/**
 * A Fragment component outputing raw data as its children.
 */
const Raw = ({ config, data }) => {
  const { component, dataField, children, ...rest } = config

  const resolvedChildren =
    dataField && data ? useDataContext(data, dataField) : children

  return <React.Fragment {...rest}>{resolvedChildren}</React.Fragment>
}

export default Raw
