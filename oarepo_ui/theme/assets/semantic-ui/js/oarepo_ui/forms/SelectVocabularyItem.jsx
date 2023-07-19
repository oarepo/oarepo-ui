import React from "react";
import { RemoteSelectField } from "react-invenio-forms";
import { useFormikContext } from "formik";
import { useFormConfig } from "@js/oarepo_ui/forms";
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
  serializeSuggestions,
  suggestionAPIHeaders,
  width,
}) => {
  const { record } = useFormConfig();
  const { values } = useFormikContext();

  return (
    <RemoteSelectField
      clearable
      onValueChange={({ formikProps }, selectedSuggestions) => {
        formikProps.form.setFieldValue(fieldPath, selectedSuggestions[0]);
      }}
      fieldPath={fieldPath}
      serializeSuggestions={serializeSuggestions}
      //   suggestion api url shall probably come from formConfig after we correct this on BE
      suggestionAPIUrl="/api/vocabularies/institutions"
      suggestionAPIHeaders={{
        Accept: "application/json",
      }}
      width={width}
    />
  );
};

SelectVocabularyItem.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  serializeSuggestions: PropTypes.func,
  suggestionAPIHeaders: PropTypes.object,
  width: PropTypes.number,
};

SelectVocabularyItem.defaultProps = {
  serializeSuggestions: () => {},
  suggestionAPIHeaders: {
    Accept: "application/json",
  },
  width: 11,
};
