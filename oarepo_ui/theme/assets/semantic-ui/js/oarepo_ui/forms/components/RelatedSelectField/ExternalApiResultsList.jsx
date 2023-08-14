import React, { useMemo } from "react";
import { Header, Grid, Icon, Label, List, Container } from "semantic-ui-react";
import { withState } from "react-searchkit";
import PropTypes from "prop-types";
import Overridable from "react-overridable";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useFormikContext } from "formik";

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
        <Container>
          <List celled divided relaxed="very" selection>
            {serializedSuggestions.map((record) => {
              const { text: title, value } = record;
              return multiple ? (
                <List.Item
                  onClick={() => {
                    handleExternalRecordChange(record);
                  }}
                  key={value}
                >
                  {title}
                </List.Item>
              ) : (
                <List.Item
                  onClick={() => {
                    handleAddingExternalApiSuggestion([record]);
                    setFieldValue(fieldPath, { id: value });
                    onClose();
                  }}
                  key={value}
                >
                  {title}
                </List.Item>
              );
            })}
          </List>
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
        </Container>
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
  onClose: PropTypes.func,
};
