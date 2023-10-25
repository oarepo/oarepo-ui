import React from "react";
import { withState } from "react-searchkit";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";

const ClearFiltersButtonComponent = ({
  updateQueryState,
  currentQueryState,
}) => {
  const { filters } = currentQueryState;
  return (
    filters.length > 0 && (
      <Button
        name="clear"
        color="orange"
        onClick={() => updateQueryState({ ...currentQueryState, filters: [] })}
        icon="delete"
        labelPosition="left"
        content={i18next.t("Clear all filters")}
        type="button"
        size="mini"
      />
    )
  );
};

export const ClearFiltersButton = withState(ClearFiltersButtonComponent);

ClearFiltersButtonComponent.propTypes = {
  updateQueryState: PropTypes.func.isRequired,
  currentQueryState: PropTypes.object.isRequired,
};
