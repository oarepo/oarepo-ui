import React from "react";
import { RemoteSelectField } from "react-invenio-forms";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Message, Icon, Label } from "semantic-ui-react";
import { ExternalApiModal } from "./ExternalApiModal";
import { NoResultsMessage } from "./NoResultsMessage";
import _reverse from "lodash/reverse";

// example usage
// the reason why it is like this is because the field can contain complex object and you somehow need to add it a value
// which can be a primitive only and if it is used directly under invenio's base form at that moment you don't have access
// to formik's values (as invenio's version does not allow to render the form as a render prop)

{
  /* <Field name="remote">
{({ form: { values } }) => {
  const fieldPath = "remote";
  return (
    <SelectVocabularyItem
      fieldPath={fieldPath}
      suggestionAPIUrl={"/api/vocabularies/institutions"}
      clearable
      externalSuggestionAPI={"/api/vocabularies/institutions"}
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
    />
  );
}}
</Field> */
}

// default serializer provided expecting that in any scenario item would have id and a title. For more specific use cases, it is necessary to
// use a different serializer in order to control the information that will be available inside of the component (coming from API)
const serializeSuggestions = (suggestions) =>
  suggestions.map((item) => ({
    text: item.title[i18next.language],
    value: item.id,
    key: item.id,
  }));

export class SelectVocabularyItem extends RemoteSelectField {
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
      ...this.state,
      isModalOpen: !this.state.isModalOpen,
    });
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
      // allow to pass a different serializer to transform data from external API in case it is needed
      serializeExternalApiSuggestions,
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
    } = this.props;
    // not sure how to pass search APP config in the best way
    // because search app is being mounted within a modal and also I don't know
    // where the component would be used in advance
    // maybe it makes sense for the component to accept searchConfig as a prop

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
      layoutOptions: {
        listView: true,
        gridView: false,
      },
    };
    return (
      <React.Fragment>
        {super.render(this.getProps())}
        {externalSuggestionAPI && (
          <ExternalApiModal
            searchConfig={searchConfig}
            open={this.state.isModalOpen}
            onClose={this.handleModal}
            serializeSuggestions={
              serializeExternalApiSuggestions !== undefined
                ? serializeExternalApiSuggestions
                : serializeSuggestions
            }
            handleAddingExternalApiSuggestion={
              this.handleAddingExternalApiSuggestion
            }
            fieldPath={fieldPath}
          />
        )}
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
  serializeExternalApiSuggestions: PropTypes.func,
};

SelectVocabularyItem.defaultProps = {
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
  serializeExternalApiSuggestions: undefined,
};
