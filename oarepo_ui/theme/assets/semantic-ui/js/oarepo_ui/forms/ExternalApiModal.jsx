import React, { useState } from "react";
import { RemoteSelectField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Modal, Button, Message, Grid, Header } from "semantic-ui-react";
import { OverridableContext } from "react-overridable";
import {
  EmptyResults,
  Error,
  ReactSearchKit,
  ResultsLoader,
  SearchBar,
  withState,
  InvenioSearchApi,
  Toggle,
  Pagination,
  ResultsPerPage,
} from "react-searchkit";
import { SelectVocabularyExternalApiResultsList } from "./SelectVocabularyExternalApiResultsList";
import { useFormikContext } from "formik";

const resultsPerPageLabel = (cmp) => (
  <React.Fragment>
    {cmp} {i18next.t("resultsPerPage")}
  </React.Fragment>
);

export const ExternalApiModal = ({
  searchConfig,
  open,
  onClose,
  serializeSuggestions,
  handleAddingExternalApiSuggestion,
  fieldPath,
}) => {
  const [externalApiRecord, setExternalApiRecord] = useState({});
  const { setFieldValue } = useFormikContext();
  const searchApi = new InvenioSearchApi(searchConfig.searchApi);

  const handleExternalRecordChange = (record) => {
    setExternalApiRecord(record);
  };
  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Header as="h6" className="pt-10 pb-10">
        <Grid>
          <Grid.Column floated="left">
            <Header as="h2">Search results from external API</Header>
          </Grid.Column>
        </Grid>
      </Modal.Header>
      <Modal.Content>
        <OverridableContext.Provider value={{}}>
          <ReactSearchKit
            searchApi={searchApi}
            appName="licenses"
            urlHandlerApi={{ enabled: false }}
            initialQueryState={searchConfig.initialQueryState}
          >
            <Grid>
              <Grid.Row>
                <Grid.Column width={8} floated="left" verticalAlign="middle">
                  <SearchBar
                    placeholder={i18next.t("Search")}
                    autofocus
                    actionProps={{
                      icon: "search",
                      content: null,
                      className: "search",
                    }}
                  />
                </Grid.Column>
              </Grid.Row>
              <Grid.Row verticalAlign="middle">
                <Grid.Column>
                  <ResultsLoader>
                    <EmptyResults />
                    <Error />
                    <SelectVocabularyExternalApiResultsList
                      serializeSuggestions={serializeSuggestions}
                      handleAddingExternalApiSuggestion={
                        handleAddingExternalApiSuggestion
                      }
                      fieldPath={fieldPath}
                      handleExternalRecordChange={handleExternalRecordChange}
                      externalApiRecord={externalApiRecord}
                    />
                  </ResultsLoader>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row verticalAlign="middle">
                <Grid.Column>
                  <Pagination />
                </Grid.Column>

                <Grid.Column floated="right" width={3}>
                  <ResultsPerPage
                    values={searchConfig.paginationOptions.resultsPerPage}
                    label={resultsPerPageLabel}
                  />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </ReactSearchKit>
        </OverridableContext.Provider>
      </Modal.Content>
      <Modal.Actions>
        <Button
          name="cancel"
          onClick={() => {
            onClose();
          }}
          icon="remove"
          labelPosition="left"
          content={i18next.t("Cancel")}
          floated="left"
        />
        <Button
          name="submit"
          primary
          icon="checkmark"
          labelPosition="left"
          content={i18next.t("Choose")}
          onClick={() => {
            setFieldValue(fieldPath, externalApiRecord);
            onClose();
          }}
        />
      </Modal.Actions>
    </Modal>
  );
};
