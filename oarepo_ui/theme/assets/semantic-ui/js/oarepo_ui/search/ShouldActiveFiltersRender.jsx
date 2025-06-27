import React from "react";
import { withState } from "react-searchkit";
import PropTypes from "prop-types";
import { ShouldRender } from "@js/oarepo_ui";
import { useActiveSearchFilters } from "./hooks";

const ShouldActiveFiltersRenderComponent = ({
  currentQueryState,
  children,
}) => {
  const { filters } = currentQueryState;

  const { activeFiltersCount } = useActiveSearchFilters(filters);

  return (
    <ShouldRender condition={activeFiltersCount > 0}>{children}</ShouldRender>
  );
};

ShouldActiveFiltersRenderComponent.propTypes = {
  currentQueryState: PropTypes.object.isRequired,
  children: PropTypes.node,
};

export const ShouldActiveFiltersRender = withState(
  ShouldActiveFiltersRenderComponent
);
