import PropTypes from "prop-types";
import React from "react";
import _groupBy from "lodash/groupBy";
import _map from "lodash/map";
import { Label, Icon, Grid } from "semantic-ui-react";
import { withState } from "react-searchkit";
import { ClearFiltersButton } from "./ClearFiltersButton";
import { useActiveSearchFilters } from "./hooks";

const getLabel = (filter, aggregations, additionalFilterLabels) => {
  const aggName = filter[0];
  const value = filter[1];

  const _getValueLabel = (aggregations) =>
    aggregations[aggName]?.buckets?.find((b) => b.key === value)?.label;

  // keep the original methodo of getting labels for backwards compatibility just in case
  // to not break existing applications
  const label =
    _getValueLabel(aggregations) ||
    _getValueLabel(additionalFilterLabels) ||
    value;

  let currentFilter = [aggName, value];
  const hasChild = filter.length === 3;
  if (hasChild) {
    const { activeFilter } = getLabel(
      filter[2],
      aggregations,
      additionalFilterLabels
    );
    currentFilter.push(activeFilter);
  }
  return {
    label: label,
    activeFilter: currentFilter,
  };
};
const ActiveFiltersElementComponent = ({
  filters = [],
  removeActiveFilter,
  currentResultsState: {
    data: { aggregations },
  },
}) => {
  const { activeSearchFilters, additionalFilterLabels } =
    useActiveSearchFilters(filters);
  const groupedData = _groupBy(activeSearchFilters, 0);
  return (
    <Grid>
      <Grid.Column only="computer">
        <div className="flex wrap align-items-center">
          {_map(groupedData, (filters, key) => {
            return (
              <Label.Group key={key} className="active-filters-group">
                <Label pointing="right">
                  <Icon name="filter" />
                  {aggregations[key]?.label ||
                    additionalFilterLabels[key]?.label ||
                    key}
                </Label>
                {filters.map((filter, index) => {
                  const { label, activeFilter } = getLabel(
                    filter,
                    aggregations,
                    additionalFilterLabels
                  );
                  return (
                    <Label
                      className="active-filter-label"
                      key={activeFilter}
                      onClick={() => removeActiveFilter(activeFilter)}
                      type="button"
                      tabIndex="0"
                      aria-label={`Remove filter ${label}`}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          removeActiveFilter(activeFilter);
                        }
                      }}
                    >
                      {label}
                      <Icon name="delete" aria-hidden="true" />
                    </Label>
                  );
                })}
              </Label.Group>
            );
          })}
          <ClearFiltersButton />
        </div>
      </Grid.Column>
    </Grid>
  );
};

export const ActiveFiltersElement = withState(ActiveFiltersElementComponent);

ActiveFiltersElementComponent.propTypes = {
  // eslint-disable-next-line react/require-default-props
  filters: PropTypes.array,
  removeActiveFilter: PropTypes.func.isRequired,
  currentResultsState: PropTypes.shape({
    data: PropTypes.shape({
      aggregations: PropTypes.object,
    }).isRequired,
  }).isRequired,
};
