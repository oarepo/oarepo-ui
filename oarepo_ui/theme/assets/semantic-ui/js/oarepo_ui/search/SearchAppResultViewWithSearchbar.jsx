import React from "react";
import {
  ResultsList,
  buildUID,
  Pagination,
  ResultsPerPage,
} from "react-searchkit";
import { Grid, Segment } from "semantic-ui-react";
import PropTypes from "prop-types";
import Overridable from "react-overridable";
import {
  ResultsPerPageLabel,
  ResultCountWithState,
  SearchAppSort,
} from "@js/oarepo_ui";

export function SearchAppResultViewWithSearchbar(props) {
  const { sortOptions, paginationOptions, currentResultsState, appName } =
    props;
  const { total } = currentResultsState.data;
  const { resultsPerPage } = paginationOptions;
  return (
    total && (
      <Grid className="rel-mb-2">
        <Grid.Row>
          <Grid.Column width={16}>
            <Segment>
              <Grid>
                <Overridable
                  id={buildUID("ResultView.resultHeader", "", appName)}
                  sortOptions={sortOptions}
                  paginationOptions={paginationOptions}
                  currentResultsState={currentResultsState}
                  appName={appName}
                >
                  <Grid.Row
                    verticalAlign="middle"
                    width={16}
                    className="results-options-row"
                  >
                    <Grid.Column textAlign="left" width={8}>
                      <ResultCountWithState />
                    </Grid.Column>
                    <Grid.Column
                      textAlign="right"
                      className="search-app-sort-container"
                      width={8}
                    >
                      <SearchAppSort options={sortOptions} />
                    </Grid.Column>
                  </Grid.Row>
                </Overridable>
                <Overridable
                  id={buildUID("ResultView.resultList", "", appName)}
                  sortOptions={sortOptions}
                  paginationOptions={paginationOptions}
                  currentResultsState={currentResultsState}
                  appName={appName}
                >
                  <Grid.Row>
                    <Grid.Column>
                      <ResultsList />
                    </Grid.Column>
                  </Grid.Row>
                </Overridable>
              </Grid>
            </Segment>
          </Grid.Column>
        </Grid.Row>
        <Overridable
          id={buildUID("ResultView.resultFooter", "", appName)}
          sortOptions={sortOptions}
          paginationOptions={paginationOptions}
          currentResultsState={currentResultsState}
          appName={appName}
        >
          <Grid.Row verticalAlign="middle">
            <Grid.Column
              className="computer tablet only"
              width={4}
            ></Grid.Column>
            <Grid.Column
              className="computer tablet only"
              width={8}
              textAlign="center"
            >
              <Pagination
                options={{
                  size: "mini",
                  showFirst: false,
                  showLast: false,
                }}
                showWhenOnlyOnePage={false}
              />
            </Grid.Column>
            <Grid.Column className="mobile only" width={16} textAlign="center">
              <Pagination
                options={{
                  size: "mini",
                  boundaryRangeCount: 0,
                  showFirst: false,
                  showLast: false,
                }}
                showWhenOnlyOnePage={false}
              />
            </Grid.Column>
            <Grid.Column
              className="computer tablet only "
              textAlign="right"
              width={4}
            >
              <ResultsPerPage
                values={resultsPerPage}
                label={ResultsPerPageLabel}
              />
            </Grid.Column>
            <Grid.Column
              className="mobile only mt-10"
              textAlign="center"
              width={16}
            >
              <ResultsPerPage
                values={resultsPerPage}
                label={ResultsPerPageLabel}
              />
            </Grid.Column>
          </Grid.Row>
        </Overridable>
      </Grid>
    )
  );
}

SearchAppResultViewWithSearchbar.propTypes = {
  sortOptions: PropTypes.array.isRequired,
  paginationOptions: PropTypes.object.isRequired,
  currentResultsState: PropTypes.object.isRequired,
  appName: PropTypes.string,
};

SearchAppResultViewWithSearchbar.defaultProps = {
  appName: "",
};
