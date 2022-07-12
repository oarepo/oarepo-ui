// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import * as React from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import Overridable from 'react-overridable'
import { Container as SemanticContainer } from 'semantic-ui-react'
import { useChildrenOrValue } from '@js/oarepo_generated_ui'
import { buildUID } from '../util'

/**
 * A Semantic-UI container
 */
const Container = ({
  data,
  useGlobalData,
  className,
  style,
  children = [],
}) => {
  return (
    <Overridable id={buildUID('Container', '', 'oarepo_ui')}>
      <SemanticContainer
        className={clsx('oarepo', 'oarepo-container', className)}
        style={style}
      >
        {useChildrenOrValue(children, data, useGlobalData)}
      </SemanticContainer>
    </Overridable>
  )
}

Container.propTypes = {
  data: PropTypes.array,
  useGlobalData: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  children: PropTypes.array,
}

export default Overridable.component('Container', Container)
