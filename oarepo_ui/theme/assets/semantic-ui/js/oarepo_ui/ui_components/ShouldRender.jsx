// Copyright (c) 2022 CESNET
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import PropTypes from 'prop-types'
import Overridable from 'react-overridable'

const ShouldRender = (condition, children) => (condition ? children : null)

ShouldRender.propTypes = {
  condition: PropTypes.bool,
  children: PropTypes.node.isRequired,
}

ShouldRender.defaultProps = {
  condition: true,
}

export default Overridable.component('ShouldRender', ShouldRender)
