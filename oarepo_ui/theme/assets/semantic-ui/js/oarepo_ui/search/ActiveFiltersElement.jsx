import PropTypes from "prop-types";
import React, { useContext } from "react";
import _groupBy from "lodash/groupBy";
import _map from "lodash/map";
import { Label, Icon, Grid } from "semantic-ui-react";
import { withState } from "react-searchkit";
import { SearchConfigurationContext } from "@js/invenio_search_ui/components";

const ActiveFiltersElementComponent = ({
  filters,
  removeActiveFilter,
  getLabel,
  currentResultsState: {
    data: { aggregations },
  },
}) => {
  const searchAppContext = useContext(SearchConfigurationContext);

  const {
    initialQueryState: { filters: initialFilters },
  } = searchAppContext;
  const filtersWithoutInitialFilters = filters?.filter(
    (f) => !initialFilters.map((f) => f[0]).includes(f[0])
  );
  const groupedData = _groupBy(filtersWithoutInitialFilters, 0);
  return (
    <Grid>
      <Grid.Column only="computer">
        {_map(groupedData, (filters, key) => (
          <Label.Group key={key}>
            <Label pointing="right">{aggregations[key]?.label}</Label>
            {filters.map((filter, index) => {
              const { label, activeFilter } = getLabel(filter);
              return (
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
      </Grid.Column>
    </Grid>
  );
};

export const ActiveFiltersElement = withState(ActiveFiltersElementComponent);

ActiveFiltersElementComponent.propTypes = {
  filters: PropTypes.array,
  removeActiveFilter: PropTypes.func.isRequired,
  getLabel: PropTypes.func.isRequired,
  currentResultsState: PropTypes.shape({
    data: PropTypes.shape({
      aggregations: PropTypes.object,
    }).isRequired,
  }).isRequired,
};
