import React, { useContext } from "react";
import { withState } from "react-searchkit";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";
import { SearchConfigurationContext } from "@js/invenio_search_ui/components";
import _uniq from "lodash/uniq";

// TODO: in next iteration, rethink how handling of initialFilters/ignored filters is to be handled
// in the best way
// in some cases, there are some permanent facets i.e. in requests open/closed,
// so we have button not remove those initial filters
const ClearFiltersButtonComponent = ({
  updateQueryState,
  currentQueryState,
  currentResultsState,
  ignoredFilters,
  clearFiltersButtonClassName,
  ...uiProps
}) => {
  const { filters } = currentQueryState;
  const searchAppContext = useContext(SearchConfigurationContext);
  const {
    initialQueryState: { filters: initialFilters },
  } = searchAppContext;

  const allFiltersToIgnore = _uniq([
    ...initialFilters.map((f) => f[0]),
    ...ignoredFilters,
  ]);
  return (
    <Button
      className={clearFiltersButtonClassName}
      aria-label={i18next.t("Clear all filters")}
      name="clear"
      onClick={() =>
        updateQueryState({
          ...currentQueryState,
          filters: filters.filter((f) => allFiltersToIgnore.includes(f[0])),
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
  ignoredFilters: PropTypes.array,
  currentResultsState: PropTypes.object.isRequired,
  clearFiltersButtonClassName: PropTypes.string,
};

ClearFiltersButtonComponent.defaultProps = {
  ignoredFilters: [],
  clearFiltersButtonClassName: "clear-filters-button",
};
