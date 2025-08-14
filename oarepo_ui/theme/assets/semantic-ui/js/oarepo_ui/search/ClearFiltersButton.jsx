import React from "react";
import { withState } from "react-searchkit";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";
import { useActiveSearchFilters } from "./hooks";

// TODO: in next iteration, rethink how handling of initialFilters/ignored filters is to be handled
// in the best way
// in some cases, there are some permanent facets i.e. in requests open/closed,
// so we have button not remove those initial filters
const ClearFiltersButtonComponent = ({
  updateQueryState,
  currentQueryState,
  currentResultsState,
  clearFiltersButtonClassName = "clear-filters-button",
  ...uiProps
}) => {
  const { filters } = currentQueryState;
  const { ignoredSearchFilters = [] } = useActiveSearchFilters(filters);

  return (
    <Button
      className={clearFiltersButtonClassName}
      aria-label={i18next.t("Clear all filters")}
      name="clear"
      onClick={() =>
        updateQueryState({
          ...currentQueryState,
          filters: filters.filter((f) => ignoredSearchFilters.includes(f[0])),
        })
      }
      icon="delete"
      labelPosition="left"
      content={i18next.t("Clear all filters")}
      type="button"
      size="mini"
      {...uiProps}
    />
  );
};

export const ClearFiltersButton = withState(ClearFiltersButtonComponent);

ClearFiltersButtonComponent.propTypes = {
  updateQueryState: PropTypes.func.isRequired,
  currentQueryState: PropTypes.object.isRequired,
  currentResultsState: PropTypes.object.isRequired,
  // eslint-disable-next-line react/require-default-props
  clearFiltersButtonClassName: PropTypes.string,
};
