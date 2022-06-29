// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { useDataContext } from '../../hooks'

/**
 * A a HTML element
 */
const Link = ({ config, data }) => {
  const { component, dataField, href, children, ...rest } = config

  const dataContext = useDataContext(data, dataField)
  const resolvedHref = dataField && dataContext != null ? dataContext : href

  return (
    <a href={resolvedHref} {...rest}>
      {children}
    </a>
  )
}

export default Link
