import React, { useState } from "react";
import { RemoteSelectField } from "react-invenio-forms";
import PropTypes from "prop-types";

// for testing purposes

const serializeSuggestions = (suggestions) =>
  suggestions.map((item) => ({
    text: item.title?.cs,
    value: item.id,
    key: item.id,
  }));

// I think this component will be possible to make generic and reusable after I understand a bit better how it is going to be used. When used
// only to get some suggestions from API when typing the component is very simple it only depends if we want multiple
// selections or one
export const SelectVocabularyItem = ({
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
  externalSuggestionAPI,
  ...uiProps
}) => {
  return (
    <RemoteSelectField
      clearable
      onValueChange={({ formikProps }, selectedSuggestions) => {
        formikProps.form.setFieldValue(fieldPath, selectedSuggestions[0]);
      }}
      fieldPath={fieldPath}
      serializeSuggestions={serializeSuggestions}
      suggestionAPIUrl={suggestionAPIUrl}
      {...uiProps}
    />
  );
};

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
  noResultsMessage: PropTypes.string,
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
  noResultsMessage: "No results found.",
  loadingMessage: "Loading...",
  preSearchChange: (x) => x,
  search: true,
  multiple: false,
  serializeAddedValue: undefined,
  initialSuggestions: [],
  onValueChange: undefined,
  suggestionAPIHeaders: { Accept: "application/json" },
};
