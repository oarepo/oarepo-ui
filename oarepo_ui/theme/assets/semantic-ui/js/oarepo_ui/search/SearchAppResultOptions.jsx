import React, { useContext } from "react";
import Overridable from "react-overridable";
import { PropTypes } from "prop-types";

import { Grid } from "semantic-ui-react";
import { Sort, withState, Pagination, ResultsPerPage } from "react-searchkit";
import { CountElement } from "./CountElement";
import { i18next } from "@translations/oarepo_ui/i18next";
import { SearchConfigurationContext } from "@js/invenio_search_ui/components";

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

export const SearchAppResultOptions = ({
  sortOptions,
  paginationOptions,
  layoutOptions,
}) => {
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
              <Sort
                sortOrderDisabled={false}
                values={sortOptions}
                ariaLabel={i18next.t("Sort")}
                label={(cmp) => (
                  <>
                    <label className="mr-10">{i18next.t("Sort by")}</label>
                    {cmp}
                  </>
                )}
              />
            </Overridable>
          )}
        </Grid.Column>
        {multipleLayouts ? (
          <Grid.Column width={3} textAlign="right">
            {/* <LayoutSwitcher /> */}
          </Grid.Column>
        ) : null}
      </Grid.Row>
      <Grid.Row verticalAlign="middle">
        <Grid.Column floated="left" width={8}>
          <Pagination
            options={{
              size: "mini",
              showFirst: false,
              showLast: false,
            }}
          />
        </Grid.Column>
        <Grid.Column floated="right" textAlign="right" width={4}>
          <ResultsPerPage
            values={paginationOptions.resultsPerPage}
            label={(cmp) => <> {cmp} results per page</>}
          />
        </Grid.Column>
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
