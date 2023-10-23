import React from "react";
import { Grid } from "semantic-ui-react";
import {
  ResultsList,
  Pagination,
  ResultsPerPage,
  ResultsMultiLayout,
  ResultsGrid,
  withState,
} from "react-searchkit";
import { ResultsPerPageLabel } from "./ResultsPerPageLabel";
import PropTypes from "prop-types";

export const SearchAppResultsComponent = ({
  paginationOptions,
  layoutOptions,
  currentResultsState: {
    data: { total },
  },
}) => {
  const { resultsPerPage } = paginationOptions;
  const multipleLayouts = layoutOptions.listView && layoutOptions.gridView;
  const listOrGridView = layoutOptions.listView ? (
    <ResultsList />
  ) : (
    <ResultsGrid />
  );

  return (
    <Grid relaxed>
      <Grid.Row>
        <Grid.Column>
          {multipleLayouts ? <ResultsMultiLayout /> : listOrGridView}
        </Grid.Column>
      </Grid.Row>
      {total > 10 && (
        <Grid.Row verticalAlign="middle">
          <Grid.Column className="computer tablet only" width={4}></Grid.Column>
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
      )}
    </Grid>
  );
};

SearchAppResultsComponent.propTypes = {
  paginationOptions: PropTypes.object.isRequired,
  layoutOptions: PropTypes.object.isRequired,
  currentResultsState: PropTypes.shape({
    data: PropTypes.shape({
      total: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
};

export const SearchAppResults = withState(SearchAppResultsComponent);
