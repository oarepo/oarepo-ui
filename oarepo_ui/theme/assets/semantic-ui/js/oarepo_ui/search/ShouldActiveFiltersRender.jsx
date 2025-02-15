import React, { useContext } from "react";
import { withState } from "react-searchkit";
import { SearchConfigurationContext } from "@js/invenio_search_ui/components";
import PropTypes from "prop-types";
import { ShouldRender } from "@js/oarepo_ui";

const ShouldActiveFiltersRenderComponent = ({
  currentQueryState,
  children,
}) => {
  const { filters } = currentQueryState;
  const { aggs } = useContext(SearchConfigurationContext);
  const aggNames = aggs.map((agg) => agg.aggName);
  const activeFiltersNumber = filters
    .map((filter) => filter[0])
    .filter((filter) => aggNames.includes(filter)).length;
  return (
    <ShouldRender condition={activeFiltersNumber > 0}>{children}</ShouldRender>
  );
};

ShouldActiveFiltersRenderComponent.propTypes = {
  currentQueryState: PropTypes.object.isRequired,
  children: PropTypes.node,
};

export const ShouldActiveFiltersRender = withState(
  ShouldActiveFiltersRenderComponent
);
