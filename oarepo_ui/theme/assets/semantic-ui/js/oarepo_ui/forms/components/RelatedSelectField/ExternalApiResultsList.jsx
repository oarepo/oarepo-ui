import React from "react";
import { Header, Radio, Grid, Checkbox, Icon, Label } from "semantic-ui-react";
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
    externalApiRecords,
    serializeExternalApiSuggestions,
    multiple,
  }) => {
    return (
      <Overridable
        id="ExternalApiSuggestions.container"
        results={results}
        handleAddingExternalApiSuggestion={handleAddingExternalApiSuggestion}
        handleExternalRecordChange={handleExternalRecordChange}
        externalApiRecords={externalApiRecords}
        serializeExternalApiSuggestions={serializeExternalApiSuggestions}
      >
        <Grid celled columns={3}>
          {serializeExternalApiSuggestions(results?.data?.hits).map(
            (record) => {
              const title = record.text;
              const isChecked = externalApiRecords.some(
                (record) => record.text === title
              );
              const isDisabled = externalApiRecords.length >= 20 && !isChecked;
              return multiple ? (
                <Grid.Row width={10} key={title}>
                  <Grid.Column width={2}>
                    <Checkbox
                      disabled={isDisabled}
                      checked={isChecked}
                      onChange={() => {
                        handleExternalRecordChange(record);
                      }}
                    />
                  </Grid.Column>
                  <Grid.Column width={8}>
                    <Header size="small" className="mt-0">
                      {title}
                    </Header>
                  </Grid.Column>
                </Grid.Row>
              ) : (
                <Grid.Row
                  key={title}
                  onClick={() => {
                    handleAddingExternalApiSuggestion([record]);
                    handleExternalRecordChange(record);
                  }}
                >
                  <Grid.Column width={2}>
                    <Radio
                      checked={externalApiRecords[0]?.text === title}
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
          {externalApiRecords.length > 0 && multiple && (
            <Grid.Column width={10}>
              <Header as="h3">Selected records</Header>
              {externalApiRecords.map((record) => (
                <Label
                  image
                  key={record.id}
                  onClick={() => handleExternalRecordChange(record)}
                >
                  {record.text}
                  <Icon name="delete" />
                </Label>
              ))}
            </Grid.Column>
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
  externalApiRecords: PropTypes.array.isRequired,
};
