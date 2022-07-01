// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'

/**
 * A span HTML element
 */
const Span = ({ config, _data }) => {
  const { component, dataField, children, ...rest } = config

  return <span {...rest}>{children}</span>
}

export default Span
