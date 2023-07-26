import React from "react";
import { RemoteSelectField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Message, Icon, Label } from "semantic-ui-react";
import { ExternalApiModal } from "./ExternalApiModal";
import { NoResultsMessage } from "./NoResultsMessage";
import _reverse from "lodash/reverse";
// example usage

{
  /* <SelectVocabularyItem
fieldPath={fieldPath}
suggestionAPIUrl={"/api/vocabularies/institutions"}
clearable
externalSuggestionAPI={"/api/vocabularies/languages"}
search={(options) => options}
selectOnBlur={false}
onValueChange={({ formikProps }, selectedItems) => {
  formikProps.form.setFieldValue(
    fieldPath,
    selectedItems[0]
  );
}}
value={
  getIn(values, "remote")?.value
    ? getIn(values, "remote")?.value
    : ""
}
/> */
}

// serializer deciedes what properties of the record passed from API you will be able to use
// in your code. I am not 100% sure yet how this component is going to be used but
// I would say that we will probably need more than just id and text representation
const serializeSuggestions = (suggestions) =>
  suggestions.map((item) => ({
    text:
      item.hierarchy.ancestors.length === 0 ? (
        item.title[i18next.language]
      ) : (
        <span>
          <Label>
            {_reverse(item.hierarchy.ancestors).map((ancestor) => (
              <React.Fragment key={ancestor}>
                {ancestor}{" "}
                <Icon size="small" name="arrow right" className="ml-3" />
              </React.Fragment>
            ))}
          </Label>
          <Label color="green" className="ml-3">
            {item.title[i18next.language]}
          </Label>
        </span>
      ),
    value: item.id,
    key: item.id,
    hierarchy: item.hierarchy,
    props: item.props,
  }));

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
    this.setState({ isModalOpen: !this.state.isModalOpen });
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

  handleAddingExternalApiSuggestion = (externalApiSuggestion) => {
    this.setState({
      suggestions: [...this.state.suggestions, externalApiSuggestion],
    });
  };

  getProps = () => {
    const {
      externalSuggestionAPI,
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
      externalSuggestionAPI,
      hierarchical,
    } = this.props;

    const searchConfig = {
      searchApi: {
        axios: {
          headers: suggestionAPIHeaders,
          url: externalSuggestionAPI,
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
    };
    console.log(this.state);
    // Call the original render method from the base class
    return (
      <React.Fragment>
        {super.render(this.getProps())}
        <ExternalApiModal
          searchConfig={searchConfig}
          open={this.state.isModalOpen}
          onClose={this.handleModal}
          serializeSuggestions={serializeSuggestions}
          // handleExternalApiSelection={this.handleExternalApiSelection}
          handleAddingExternalApiSuggestion={
            this.handleAddingExternalApiSuggestion
          }
          fieldPath={fieldPath}
        />
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
  hierarchical: PropTypes.bool,
};

RemoteSelectField.defaultProps = {
  debounceTime: 500,
  suggestionAPIQueryParams: {},
  serializeSuggestions: serializeSuggestions,
  suggestionsErrorMessage: "Something went wrong...",
  noQueryMessage: "Search...",
  noResultsMessage: "No results found.",
  loadingMessage: "Loading...",
  preSearchChange: (x) => x,
  search: true,
  multiple: false,
  serializeAddedValue: undefined,
  initialSuggestions: [],
  onValueChange: undefined,
  suggestionAPIHeaders: { Accept: "application/json" },
  hierarchical: true,
};
