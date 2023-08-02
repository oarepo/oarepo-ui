import React, { useMemo } from "react";
import { Header, Grid, Checkbox, Icon, Label, Button } from "semantic-ui-react";
import { withState } from "react-searchkit";
import PropTypes from "prop-types";
import Overridable from "react-overridable";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useFormikContext } from "formik";

// this search app is wrapped by its own overridable context
// maybe the main component should also accept overriden components as props
// for a case where we would have multiple such inputs in the same app
// and want to have each render something differently

// make another fieldPath with _ that would hold actually state we are
// sending to the server it should be fieldPath : {id :"string"}
// do language fall back to avoid getting undefined title text when
// translation to current i18 language is not available

export const ExternalApiResultsList = withState(
  ({
    currentResultsState: results,
    handleAddingExternalApiSuggestion,
    handleExternalRecordChange,
    externalApiRecords,
    serializeExternalApiSuggestions,
    multiple,
    fieldPath,
    onClose,
  }) => {
    const { setFieldValue } = useFormikContext();
    const serializedSuggestions = useMemo(() => {
      return serializeExternalApiSuggestions(results?.data?.hits);
    }, [results]);
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
          {serializedSuggestions.map((record) => {
            const title = record.text;
            const isSelected = externalApiRecords.some(
              (record) => record.text === title
            );
            return multiple ? (
              <Grid.Row key={record.value}>
                <Grid.Column width={16}>
                  <Button
                    onClick={() => {
                      handleExternalRecordChange(record);
                    }}
                    fluid
                    content={title}
                    color={isSelected ? "green" : "blue"}
                  />
                </Grid.Column>
              </Grid.Row>
            ) : (
              <Grid.Row key={record.value}>
                <Grid.Column width={16}>
                  <Button
                    onClick={() => {
                      handleAddingExternalApiSuggestion([record]);
                      setFieldValue(fieldPath, { id: record.value });
                      onClose();
                    }}
                    fluid
                    content={title}
                    primary
                  />
                </Grid.Column>
              </Grid.Row>
            );
          })}
          {externalApiRecords.length > 0 && multiple && (
            <Grid.Column width={10}>
              <Header as="h3">{i18next.t("Selected records")}</Header>
              {externalApiRecords.map((record) => (
                <Label
                  image
                  key={record.value}
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
  multiple: PropTypes.bool.isRequired,
  fieldPath: PropTypes.string.isRequired,
};
