import React, { useContext } from "react";
import Overridable from "react-overridable";
import { PropTypes } from "prop-types";
import { Grid } from "semantic-ui-react";
import { withState, LayoutSwitcher } from "react-searchkit";
import { CountElement } from "./CountElement";
import { i18next } from "@translations/oarepo_ui/i18next";
import { SearchConfigurationContext } from "@js/invenio_search_ui/components";
import { SearchAppSort } from "./SearchAppSort";

export const ResultCount = ({ currentResultsState = {} }) => {
  const { total } = currentResultsState.data;
  const { loading } = currentResultsState;
  const { buildUID } = useContext(SearchConfigurationContext);

  const resultsLoaded = !loading && total > 0;

  return (
    resultsLoaded && (
      <Overridable id={buildUID("Count.element")} totalResults={total}>
        <CountElement totalResults={total} />
      </Overridable>
    )
  );
};

const ResultCountWithState = withState(ResultCount);

const sortTranslation = (sortOptions) => {
  const translatedSortOptions = sortOptions.map((sortOption) => {
    return {
      ...sortOption,
      text: i18next.t(sortOption.sortBy),
    };
  });
  return translatedSortOptions;
};

export const SearchAppResultOptions = ({ sortOptions, layoutOptions }) => {
  sortOptions = sortTranslation(sortOptions);
  const { buildUID } = useContext(SearchConfigurationContext);
  const multipleLayouts =
    Object.values(layoutOptions).filter((i) => i).length > 1;
  return (
    <Grid>
      <Grid.Row verticalAlign="middle">
        <Grid.Column
          floated="left"
          textAlign="left"
          width={multipleLayouts ? 5 : 8}
        >
          <ResultCountWithState />
        </Grid.Column>
        <Grid.Column width={8} textAlign="right" floated="right">
          {sortOptions && (
            <Overridable id={buildUID("SearchApp.sort")} options={sortOptions}>
              <SearchAppSort />
            </Overridable>
          )}
        </Grid.Column>
        {multipleLayouts ? (
          <Grid.Column width={3} textAlign="right">
            {multipleLayouts && <LayoutSwitcher />}
          </Grid.Column>
        ) : null}
      </Grid.Row>
    </Grid>
  );
};

SearchAppResultOptions.propTypes = {
  currentResultsState: PropTypes.object.isRequired,
  sortOptions: PropTypes.arrayOf(
    PropTypes.shape({
      sortBy: PropTypes.string,
      text: PropTypes.string,
    })
  ),
  paginationOptions: PropTypes.shape({
    defaultValue: PropTypes.number,
    resultsPerPage: PropTypes.array,
  }),
  layoutOptions: PropTypes.object,
};
