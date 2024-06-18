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
  const searchAppContext = useContext(SearchConfigurationContext);
  const {
    initialQueryState: { filters: initialFilters },
  } = searchAppContext;
  return (
    <ShouldRender condition={filters?.length > initialFilters?.length}>
      {children}
    </ShouldRender>
  );
};

ShouldActiveFiltersRenderComponent.propTypes = {
  currentQueryState: PropTypes.object.isRequired,
  children: PropTypes.node,
};

export const ShouldActiveFiltersRender = withState(
  ShouldActiveFiltersRenderComponent
);
