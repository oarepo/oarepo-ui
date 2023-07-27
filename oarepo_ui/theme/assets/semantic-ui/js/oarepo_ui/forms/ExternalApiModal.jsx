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
import { SelectVocabularyExternalApiResultsList } from "./SelectVocabularyExternalApiResultsList";
import { useFormikContext } from "formik";
import _isEmpty from "lodash/isEmpty";

const resultsPerPageLabel = (cmp) => (
  <React.Fragment>
    {cmp} {i18next.t("resultsPerPage")}
  </React.Fragment>
);

//  providing custom empty error message because we are initializing app with a query string and the button to reset search effectivelly does nothing (it is resetting to already existing query string so I thought it is useless)
// and I dont see a reasonable way to override resetQuery action from react searchkit
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
}) => {
  const [externalApiRecord, setExternalApiRecord] = useState({});
  const { setFieldValue } = useFormikContext();
  const searchApi = new InvenioSearchApi(searchConfig.searchApi);
  console.log(searchConfig);
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
                  <Pagination options={{ size: "tiny" }} />
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
          disabled={_isEmpty(externalApiRecord)}
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

ExternalApiModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  handleAddingExternalApiSuggestion: PropTypes.func.isRequired,
  fieldPath: PropTypes.string.isRequired,
  searchConfig: PropTypes.shape({
    searchApi: PropTypes.object.isRequired, // same as ReactSearchKit.searchApi
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
