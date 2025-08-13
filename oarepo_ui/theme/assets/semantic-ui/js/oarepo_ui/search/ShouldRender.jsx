import PropTypes from "prop-types";
import { Component } from "react";
import Overridable from "react-overridable";

// For some reason, the component is not exported from React Searchkit

class ShouldRenderComponent extends Component {
  render() {
    const { children, condition = true } = this.props;
    return condition ? children : null;
  }
}

ShouldRenderComponent.propTypes = {
  // eslint-disable-next-line react/require-default-props
  condition: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export const ShouldRender = Overridable.component(
  "ShouldRender",
  ShouldRenderComponent
);
