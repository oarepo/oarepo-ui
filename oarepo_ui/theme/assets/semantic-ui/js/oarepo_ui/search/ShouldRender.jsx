import PropTypes from "prop-types";
import { Component } from "react";
import Overridable from "react-overridable";

// For some reason, the component is not exported from React Searchkit

class ShouldRenderComponent extends Component {
  render() {
    const { children, condition } = this.props;
    return condition ? children : null;
  }
}

ShouldRenderComponent.propTypes = {
  condition: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

ShouldRenderComponent.defaultProps = {
  condition: true,
};

export const ShouldRender = Overridable.component(
  "ShouldRender",
  ShouldRenderComponent
);
