// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import { Label } from 'semantic-ui-react'
import clsx from 'clsx'

/**
 * Longer text that will be displayed truncated, with an option to show more.
 */
const Separator = ({ config }) => {
  const { component, className, color, double, ...rest } = config

  // @ts-ignore until Semantic-UI fully supports newest React
  return (
    <Label basic className={clsx(color, className)} {...rest}>
      {double ? '‖' : '❙'}
    </Label>
  )
}

export default Separator
