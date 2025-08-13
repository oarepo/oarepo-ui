import React from "react";
import { withState } from "react-searchkit";
import PropTypes from "prop-types";
import { ShouldRender } from "./ShouldRender";
import { useActiveSearchFilters } from "./hooks";

const ShouldActiveFiltersRenderComponent = ({
  currentQueryState,
  children = null,
}) => {
  const { filters } = currentQueryState;

  const { activeFiltersCount } = useActiveSearchFilters(filters);

  return (
    <ShouldRender condition={activeFiltersCount > 0}>{children}</ShouldRender>
  );
};

ShouldActiveFiltersRenderComponent.propTypes = {
  currentQueryState: PropTypes.object.isRequired,
  // eslint-disable-next-line react/require-default-props
  children: PropTypes.node,
};

export const ShouldActiveFiltersRender = withState(
  ShouldActiveFiltersRenderComponent
);
