import React from "react";
import { Header, Radio, Grid, Table } from "semantic-ui-react";
import { withState } from "react-searchkit";
import _toPairs from "lodash/toPairs";
import _chunk from "lodash/chunk";
import PropTypes from "prop-types";
import Overridable from "react-overridable";

// this search app is wrapped by its own overridable context
// maybe the main component should also accept overriden components as props
// for a case where we would have multiple such inputs in the same app
// and want to have each render something differently

export const SelectVocabularyExternalApiResultsList = withState(
  ({
    currentResultsState: results,
    handleAddingExternalApiSuggestion,
    handleExternalRecordChange,
    externalApiRecord,
    serializeSuggestions,
  }) => {
    return (
      <Overridable
        id="ExternalApiSuggestions.container"
        results={results}
        handleAddingExternalApiSuggestion={handleAddingExternalApiSuggestion}
        handleExternalRecordChange={handleExternalRecordChange}
        externalApiRecord={externalApiRecord}
        serializeSuggestions={serializeSuggestions}
      >
        <Grid celled>
          {serializeSuggestions(results?.data?.hits).map((record) => {
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
          })}
        </Grid>
      </Overridable>
    );
  }
);

SelectVocabularyExternalApiResultsList.propTypes = {
  currentResultsState: PropTypes.arrayOf(PropTypes.object),
  handleAddingExternalApiSuggestion: PropTypes.func.isRequired,
  handleExternalRecordChange: PropTypes.func.isRequired,
  externalApiRecord: PropTypes.object.isRequired,
};
