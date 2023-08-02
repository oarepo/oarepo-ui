import React from "react";
import { RemoteSelectField, SelectField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Message } from "semantic-ui-react";
import { ExternalApiModal } from "./ExternalApiModal";
import { NoResultsMessage } from "./NoResultsMessage";
import _isEmpty from "lodash/isEmpty";

export class RelatedSelectFieldInternal extends RemoteSelectField {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      isModalOpen: false,
    };
    this.handleModal = this.handleModal.bind(this);
  }

  handleModal = () => {
    this.setState({
      isModalOpen: !this.state.isModalOpen,
    });
  };

  getNoResultsMessage = () => {
    const {
      loadingMessage,
      suggestionsErrorMessage,
      noQueryMessage,
      externalSuggestionApi,
      noResultsMessage,
      externalApiButtonContent,
    } = this.props;
    const { isFetching, error, searchQuery } = this.state;
    if (isFetching) {
      return loadingMessage;
    }
    if (error) {
      return <Message negative size="mini" content={suggestionsErrorMessage} />;
    }
    if (!searchQuery) {
      return noQueryMessage;
    }
    return externalSuggestionApi ? (
      <NoResultsMessage
        noResultsMessage={i18next.t("No results found")}
        handleModal={this.handleModal}
        externalApiButtonContent={externalApiButtonContent}
      />
    ) : (
      noResultsMessage
    );
  };

  handleAddingExternalApiSuggestion = (externalApiSuggestions) => {
    this.setState({
      suggestions: [...externalApiSuggestions],
    });
  };

  getProps = () => {
    const {
      // allow to pass a different serializer to transform data from external API in case it is needed
      externalApiButtonContent,
      externalApiModalTitle,
      serializeExternalApiSuggestions,
      externalSuggestionApi,
      hierarchical,
      fieldPath,
      suggestionAPIUrl,
      suggestionAPIQueryParams,
      serializeSuggestions,
      serializeAddedValue,
      suggestionAPIHeaders,
      debounceTime,
      noResultsMessage,
      loadingMessage,
      suggestionsErrorMessage,
      noQueryMessage,
      initialSuggestions,
      preSearchChange,
      onValueChange,
      search,
      ...uiProps
    } = this.props;
    const compProps = {
      fieldPath,
      suggestionAPIUrl,
      suggestionAPIQueryParams,
      suggestionAPIHeaders,
      serializeSuggestions,
      serializeAddedValue,
      debounceTime,
      noResultsMessage,
      loadingMessage,
      suggestionsErrorMessage,
      noQueryMessage,
      initialSuggestions,
      preSearchChange,
      onValueChange,
      search,
    };
    return { compProps, uiProps };
  };

  render() {
    const {
      serializeSuggestions,
      fieldPath,
      suggestionAPIHeaders,
      externalSuggestionApi,
      serializeExternalApiSuggestions,
      externalApiModalTitle,
      multiple,
    } = this.props;

    const { compProps, uiProps } = this.getProps();

    const searchConfig = {
      searchApi: {
        axios: {
          headers: suggestionAPIHeaders,
          url: externalSuggestionApi,
          withCredentials: false,
        },
      },
      initialQueryState: {
        queryString: this.state.searchQuery,
        size: 10,
      },
      paginationOptions: {
        defaultValue: 10,
        resultsPerPage: [
          { text: "10", value: 10 },
          { text: "20", value: 20 },
          { text: "50", value: 50 },
        ],
      },
      layoutOptions: {
        listView: true,
        gridView: false,
      },
    };
    return (
      <React.Fragment>
        <SelectField
          {...uiProps}
          allowAdditions={this.error ? false : uiProps.allowAdditions}
          fieldPath={compProps.fieldPath}
          options={this.state.suggestions}
          noResultsMessage={this.getNoResultsMessage()}
          search={compProps.search}
          lazyLoad
          open={this.open}
          onClose={this.onClose}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          onSearchChange={this.onSearchChange}
          onAddItem={({ event, data, formikProps }) => {
            this.handleAddition(event, data, (selectedSuggestions) => {
              if (compProps.onValueChange) {
                compProps.onValueChange(
                  { event, data, formikProps },
                  selectedSuggestions
                );
              }
            });
          }}
          onChange={({ event, data, formikProps }) => {
            this.onSelectValue(event, data, (selectedSuggestions) => {
              if (data.value === "" || _isEmpty(data.value)) {
                this.setState({ suggestions: [] });
              }
              if (compProps.onValueChange) {
                compProps.onValueChange(
                  { event, data, formikProps },
                  selectedSuggestions
                );
              } else {
                formikProps.form.setFieldValue(compProps.fieldPath, data.value);
              }
            });
          }}
          loading={this.isFetching}
          className="invenio-remote-select-field"
        />
        {externalSuggestionApi && (
          <ExternalApiModal
            searchConfig={searchConfig}
            open={this.state.isModalOpen}
            onClose={this.handleModal}
            serializeExternalApiSuggestions={
              serializeExternalApiSuggestions
                ? serializeExternalApiSuggestions
                : serializeSuggestions
            }
            handleAddingExternalApiSuggestion={
              this.handleAddingExternalApiSuggestion
            }
            fieldPath={fieldPath}
            externalApiModalTitle={externalApiModalTitle}
            multiple={multiple}
          />
        )}
      </React.Fragment>
    );
  }
}

RelatedSelectFieldInternal.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  suggestionAPIUrl: PropTypes.string.isRequired,
  suggestionAPIQueryParams: PropTypes.object,
  suggestionAPIHeaders: PropTypes.object,
  serializeSuggestions: PropTypes.func,
  serializeAddedValue: PropTypes.func,
  initialSuggestions: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.object),
    PropTypes.object,
  ]),
  debounceTime: PropTypes.number,
  noResultsMessage: PropTypes.node,
  loadingMessage: PropTypes.string,
  suggestionsErrorMessage: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),
  noQueryMessage: PropTypes.string,
  preSearchChange: PropTypes.func, // Takes a string and returns a string
  onValueChange: PropTypes.func, // Takes the SUI hanf and updated selectedSuggestions
  search: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  multiple: PropTypes.bool,
  externalSuggestionApi: PropTypes.string,
  serializeExternalApiSuggestions: PropTypes.func,
  externalApiButtonContent: PropTypes.string,
  externalApiModalTitle: PropTypes.string,
};

RelatedSelectFieldInternal.defaultProps = {
  debounceTime: 500,
  suggestionAPIQueryParams: {},
  suggestionsErrorMessage: i18next.t("Something went wrong..."),
  noQueryMessage: i18next.t("search"),
  noResultsMessage: i18next.t("No results found"),
  loadingMessage: i18next.t("Loading..."),
  preSearchChange: (x) => x,
  search: true,
  multiple: false,
  serializeAddedValue: undefined,
  initialSuggestions: [],
  onValueChange: undefined,
  suggestionAPIHeaders: { Accept: "application/json" },
  serializeExternalApiSuggestions: undefined,
  externalApiButtonContent: i18next.t("Search External Database"),
  externalApiModalTitle: i18next.t("Search results from external API"),
};
