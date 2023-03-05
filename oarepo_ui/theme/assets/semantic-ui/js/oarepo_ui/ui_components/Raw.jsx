// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import PropTypes from 'prop-types'
import { useChildrenOrValue } from '@js/oarepo_generated_ui'
import { withDataArray } from '@uijs/oarepo_generated_ui/ui_components'

const RawValue = ({ children, data, useGlobalData }) =>
  useChildrenOrValue(children, data, useGlobalData)

/**
 * A Fragment component outputing raw data as its children.
 */
const Raw = ({ data, useGlobalData, children }) => {
  const RawComponent = withDataArray(RawValue)

  return <RawComponent {...{ children, data, useGlobalData }} />
}

Raw.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  children: PropTypes.node,
}

export default Raw
