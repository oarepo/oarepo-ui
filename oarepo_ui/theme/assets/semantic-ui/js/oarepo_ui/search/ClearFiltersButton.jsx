// SPDX-FileCopyrightText: 2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import React from "react";
import { withState } from "react-searchkit";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";
import { useActiveSearchFilters } from "./hooks";

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
      aria-label={i18next.t("Delete All")}
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
