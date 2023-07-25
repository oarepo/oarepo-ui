import React from "react";
import { RemoteSelectField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Message } from "semantic-ui-react";
import { ExternalApiModal } from "./ExternalApiModal";
import { NoResultsMessage } from "./NoResultsMessage";

const resultsPerPageLabel = (cmp) => (
  <React.Fragment>
    {cmp} {i18next.t("resultsPerPage")}
  </React.Fragment>
);

NoResultsMessage.propTypes = {
  noResultsMessage: PropTypes.node,
};

NoResultsMessage.defaultProps = {
  noResultsMessage: "No results found",
};
// for testing purposes

const serializeSuggestions = (suggestions) =>
  suggestions.map((item) => ({
    text: item.title?.[i18next.language],
    value: item.id,
    key: item.id,
  }));
console.log(i18next.language);

export class SelectVocabularyItem extends RemoteSelectField {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      isModalOpen: false,
    };
    console.log(this.state);
    this.handleModal = this.handleModal.bind(this);
  }

  handleModal = () => {
    this.setState({ ...this.state, isModalOpen: !this.state.isModalOpen });
  };
  getNoResultsMessage = () => {
    const {
      loadingMessage,
      suggestionsErrorMessage,
      noQueryMessage,
      externalSuggestionAPI,
      noResultsMessage,
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
    return externalSuggestionAPI ? (
      <NoResultsMessage
        noResultsMessage={"No results found"}
        handleModal={this.handleModal}
      />
    ) : (
      noResultsMessage
    );
  };

  render() {
    const parentRenderResult = super.render();
    // You can add your custom content here

    const searchConfig = {
      searchApi: {
        axios: {
          headers: this.props.suggestionAPIHeaders,
          url: this.props.externalSuggestionAPI,
          withCredentials: false,
        },
      },
      initialQueryState: {
        queryString: this.state.searchQuery,
      },
      paginationOptions: {
        defaultValue: 10,
        resultsPerPage: [
          { text: "10", value: 10 },
          { text: "20", value: 20 },
          { text: "50", value: 50 },
        ],
      },
    };

    const additionalContent = (
      <ExternalApiModal
        searchConfig={searchConfig}
        open={this.state.isModalOpen}
        onClose={this.handleModal}
        serializeSuggestions={this.props.serializeSuggestions}
      />
    );

    // Call the original render method from the base class
    return (
      <React.Fragment>
        {parentRenderResult}

        {additionalContent}
      </React.Fragment>
    );
  }
}

SelectVocabularyItem.propTypes = {
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
  externalSuggestionAPI: PropTypes.string,
};

RemoteSelectField.defaultProps = {
  debounceTime: 500,
  suggestionAPIQueryParams: {},
  serializeSuggestions: serializeSuggestions,
  suggestionsErrorMessage: "Something went wrong...",
  noQueryMessage: "Search...",
  // noResultsMessage: "No results found.",
  loadingMessage: "Loading...",
  preSearchChange: (x) => x,
  search: true,
  multiple: false,
  serializeAddedValue: undefined,
  initialSuggestions: [],
  onValueChange: undefined,
  suggestionAPIHeaders: { Accept: "application/json" },
};
