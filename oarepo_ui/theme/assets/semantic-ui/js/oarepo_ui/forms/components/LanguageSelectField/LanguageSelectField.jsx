import * as React from "react";
import { VocabularyField } from "@js/oarepo_vocabularies";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";
import { useFormikContext, getIn } from "formik";

export const LanguageSelectField = ({
  fieldPath,
  label = i18next.t("Language"),
  vocabularyName = "languages",
  labelIcon = "globe",
  required = false,
  multiple = false,
  placeholder = i18next.t(
    'Search for a language by name (e.g "eng", "fr" or "Polish")'
  ),
  clearable = true,
  usedLanguages = [],
  ...uiProps
}) => {
  const { values } = useFormikContext();
  return (
    <VocabularyField
      deburr
      fieldPath={fieldPath}
      placeholder={placeholder}
      required={required}
      clearable={clearable}
      multiple={multiple}
      label={label}
      vocabularyName={vocabularyName}
      usedOptions={usedLanguages}
      onChange={({ e, data, formikProps }) => {
        formikProps.form.setFieldValue(fieldPath, data.value);
      }}
      onValueChange={undefined}
      value={getIn(values, fieldPath, "") ?? ""}
      {...uiProps}
    />
  );
};

LanguageSelectField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  /* eslint-disable react/require-default-props */
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  labelIcon: PropTypes.string,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  clearable: PropTypes.bool,
  placeholder: PropTypes.string,
  usedLanguages: PropTypes.array,
  vocabularyName: PropTypes.string,
  /* eslint-enable react/require-default-props */
};
