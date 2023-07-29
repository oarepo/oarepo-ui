import React from "react";
import { Header, Radio, Grid } from "semantic-ui-react";
import { withState } from "react-searchkit";
import PropTypes from "prop-types";
import Overridable from "react-overridable";

// this search app is wrapped by its own overridable context
// maybe the main component should also accept overriden components as props
// for a case where we would have multiple such inputs in the same app
// and want to have each render something differently

export const ExternalApiResultsList = withState(
  ({
    currentResultsState: results,
    handleAddingExternalApiSuggestion,
    handleExternalRecordChange,
    externalApiRecord,
    serializeExternalApiSuggestions,
  }) => {
    return (
      <Overridable
        id="ExternalApiSuggestions.container"
        results={results}
        handleAddingExternalApiSuggestion={handleAddingExternalApiSuggestion}
        handleExternalRecordChange={handleExternalRecordChange}
        externalApiRecord={externalApiRecord}
        serializeExternalApiSuggestions={serializeExternalApiSuggestions}
      >
        <Grid celled>
          {serializeExternalApiSuggestions(results?.data?.hits).map(
            (record) => {
              const title = record.text;
              return (
                <Grid.Row
                  key={title}
                  onClick={() => {
                    handleAddingExternalApiSuggestion(record);
                    handleExternalRecordChange(record);
                  }}
                >
                  <Grid.Column width={2}>
                    <Radio
                      checked={externalApiRecord.text === title}
                      onChange={() => handleExternalRecordChange(record)}
                    />
                  </Grid.Column>
                  <Grid.Column width={8}>
                    <Header size="small" className="mt-0">
                      {title}
                    </Header>
                  </Grid.Column>
                </Grid.Row>
              );
            }
          )}
        </Grid>
      </Overridable>
    );
  }
);

ExternalApiResultsList.propTypes = {
  currentResultsState: PropTypes.arrayOf(PropTypes.object),
  handleAddingExternalApiSuggestion: PropTypes.func.isRequired,
  handleExternalRecordChange: PropTypes.func.isRequired,
  externalApiRecord: PropTypes.object.isRequired,
};
