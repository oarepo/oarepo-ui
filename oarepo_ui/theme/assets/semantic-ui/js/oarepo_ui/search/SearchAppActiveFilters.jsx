import PropTypes from "prop-types";
import React from "react";
import _groupBy from "lodash/groupBy";
import _map from "lodash/map";
import { Label, Icon } from "semantic-ui-react";
import { withState } from "react-searchkit";

const SearchAppActiveFiltersComponent = ({
  filters,
  removeActiveFilter,
  getLabel,
  currentResultsState: {
    data: { aggregations },
  },
}) => {
  const groupedData = _groupBy(filters, 0);

  return (
    <>
      {_map(groupedData, (filters, key) => (
        <Label.Group key={key}>
          <Label pointing="right">{aggregations[key]?.label}</Label>
          {filters.map((filter, index) => {
            const { label, activeFilter } = getLabel(filter);
            return (
              // eslint-disable-next-line react/no-array-index-key
              <Label
                color="blue"
                key={activeFilter}
                onClick={() => removeActiveFilter(activeFilter)}
              >
                <Icon name="filter" />
                {label}
                <Icon name="delete" />
              </Label>
            );
          })}
        </Label.Group>
      ))}
    </>
  );
};

export const SearchAppActiveFilters = withState(
  SearchAppActiveFiltersComponent
);

SearchAppActiveFiltersComponent.propTypes = {
  filters: PropTypes.array,
  removeActiveFilter: PropTypes.func.isRequired,
  getLabel: PropTypes.func.isRequired,
  currentResultsState: PropTypes.shape({
    data: PropTypes.shape({
      aggregations: PropTypes.object,
    }).isRequired,
  }).isRequired,
};
