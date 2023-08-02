import React, { useState } from "react";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Modal, Button, Grid, Header, Segment, Icon } from "semantic-ui-react";
import { OverridableContext } from "react-overridable";
import {
  EmptyResults,
  Error,
  ReactSearchKit,
  ResultsLoader,
  SearchBar,
  InvenioSearchApi,
  Pagination,
  ResultsPerPage,
} from "react-searchkit";
import { ExternalApiResultsList } from "./ExternalApiResultsList";
import { useFormikContext } from "formik";
import _isEmpty from "lodash/isEmpty";
import { ResultsPerPageLabel } from "@js/oarepo_ui/search/";

export const EmptyResultsElement = ({ queryString }) => {
  return (
    <Segment placeholder textAlign="center">
      <Header icon>
        <Icon name="search" />
      </Header>
      {queryString && (
        <em>
          {i18next.t("We couldn't find any matches for ")} "{queryString}"
        </em>
      )}
      <br />
    </Segment>
  );
};

EmptyResultsElement.propTypes = {
  queryString: PropTypes.string,
  resetQuery: PropTypes.func.isRequired,
  extraContent: PropTypes.node,
};

const overriddenComponents = {
  ["EmptyResults.element"]: EmptyResultsElement,
};

export const ExternalApiModal = ({
  searchConfig,
  open,
  onClose,
  handleAddingExternalApiSuggestion,
  fieldPath,
  serializeExternalApiSuggestions,
  externalApiModalTitle,
  multiple,
}) => {
  const [externalApiRecords, setExternalApiRecords] = useState([]);
  const { setFieldValue } = useFormikContext();
  const searchApi = new InvenioSearchApi(searchConfig.searchApi);
  const handleExternalRecordChange = (record) => {
    if (multiple) {
      const recordIndex = externalApiRecords.findIndex(
        (item) => item.text === record.text
      );
      if (recordIndex === -1) {
        setExternalApiRecords((prevSelected) => [...prevSelected, record]);
      } else {
        setExternalApiRecords((prevSelected) => {
          const updatedSelected = [...prevSelected];
          updatedSelected.splice(recordIndex, 1);
          return updatedSelected;
        });
      }
    } else {
      setExternalApiRecords([record]);
    }
  };
  return (
    <Modal open={open} onClose={onClose} closeIcon className="rel-mt-2">
      <Modal.Header as="h6" className="pt-10 pb-10">
        <Grid>
          <Grid.Column floated="left">
            <Header as="h2">{externalApiModalTitle}</Header>
          </Grid.Column>
        </Grid>
      </Modal.Header>
      <Modal.Content>
        <OverridableContext.Provider value={overriddenComponents}>
          <ReactSearchKit
            searchApi={searchApi}
            initialQueryState={searchConfig.initialQueryState}
            urlHandlerApi={{ enabled: false }}
          >
            <Grid celled="internally">
              <Grid.Row>
                <Grid.Column width={8} floated="left" verticalAlign="middle">
                  <SearchBar
                    placeholder={i18next.t("search")}
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
                    <ExternalApiResultsList
                      handleAddingExternalApiSuggestion={
                        handleAddingExternalApiSuggestion
                      }
                      handleExternalRecordChange={handleExternalRecordChange}
                      externalApiRecords={externalApiRecords}
                      serializeExternalApiSuggestions={
                        serializeExternalApiSuggestions
                      }
                      multiple={multiple}
                      fieldPath={fieldPath}
                      onClose={onClose}
                    />
                  </ResultsLoader>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row verticalAlign="middle">
                <Grid.Column>
                  <Pagination options={{ size: "tiny" }} />
                </Grid.Column>

                <Grid.Column floated="right" width={3}>
                  <ResultsPerPage
                    values={searchConfig.paginationOptions.resultsPerPage}
                    label={ResultsPerPageLabel}
                  />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </ReactSearchKit>
        </OverridableContext.Provider>
      </Modal.Content>
      <Modal.Actions>
        {multiple && (
          <Button
            disabled={_isEmpty(externalApiRecords)}
            primary
            icon="checkmark"
            labelPosition="left"
            content={i18next.t("Choose")}
            onClick={() => {
              handleAddingExternalApiSuggestion(externalApiRecords);
              setFieldValue(
                fieldPath,
                externalApiRecords.map((record) => ({ id: record.value }))
              );
              setExternalApiRecords([]);
              onClose();
            }}
          />
        )}
      </Modal.Actions>
    </Modal>
  );
};

ExternalApiModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  handleAddingExternalApiSuggestion: PropTypes.func.isRequired,
  fieldPath: PropTypes.string.isRequired,
  searchConfig: PropTypes.shape({
    searchApi: PropTypes.object.isRequired,
    initialQueryState: PropTypes.shape({
      queryString: PropTypes.string,
      sortBy: PropTypes.string,
      sortOrder: PropTypes.string,
      page: PropTypes.number,
      size: PropTypes.number,
      hiddenParams: PropTypes.array,
      layout: PropTypes.oneOf(["list", "grid"]),
    }),
    aggs: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        aggName: PropTypes.string,
        access_right: PropTypes.string,
        mapping: PropTypes.object,
      })
    ),
    sortOptions: PropTypes.arrayOf(
      PropTypes.shape({
        sortBy: PropTypes.string,
        sortOrder: PropTypes.string,
        text: PropTypes.string,
      })
    ),
    paginationOptions: PropTypes.shape({
      resultsPerPage: PropTypes.arrayOf(
        PropTypes.shape({
          text: PropTypes.string,
          value: PropTypes.number,
        })
      ),
    }),
    layoutOptions: PropTypes.shape({
      listView: PropTypes.bool.isRequired,
      gridView: PropTypes.bool.isRequired,
    }).isRequired,
    defaultSortingOnEmptyQueryString: PropTypes.shape({
      sortBy: PropTypes.string,
      sortOrder: PropTypes.string,
    }),
  }).isRequired,
  appName: PropTypes.string,
};

ExternalApiModal.defaultProps = {
  searchConfig: {
    searchApi: {
      url: "",
      withCredentials: false,
      headers: {},
    },
    initialQueryState: {},
    aggs: [],
    sortOptions: [],
    paginationOptions: {},
    layoutOptions: {
      listView: true,
      gridView: false,
    },
    defaultSortingOnEmptyQueryString: {},
  },
  appName: null,
};
