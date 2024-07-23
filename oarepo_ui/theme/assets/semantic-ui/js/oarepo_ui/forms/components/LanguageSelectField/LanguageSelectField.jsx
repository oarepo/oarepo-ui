import * as React from "react";
import { LocalVocabularySelectField } from "@js/oarepo_vocabularies";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";
import { useFormikContext, getIn } from "formik";

export const LanguageSelectField = ({
  fieldPath,
  label,
  labelIcon,
  required,
  multiple,
  placeholder,
  clearable,
  usedLanguages,
  ...uiProps
}) => {
  const { values } = useFormikContext();
  return (
    <LocalVocabularySelectField
      deburr
      fieldPath={fieldPath}
      placeholder={placeholder}
      required={required}
      clearable={clearable}
      multiple={multiple}
      label={label}
      optionsListName="languages"
      usedOptions={usedLanguages}
      onChange={({ e, data, formikProps }) => {
        formikProps.form.setFieldValue(fieldPath, data.value);
      }}
      value={getIn(values, fieldPath, "") ?? ""}
      {...uiProps}
    />
  );
};

LanguageSelectField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  labelIcon: PropTypes.string,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  clearable: PropTypes.bool,
  placeholder: PropTypes.string,
  options: PropTypes.array,
  usedLanguages: PropTypes.array,
};

LanguageSelectField.defaultProps = {
  label: i18next.t("Language"),
  labelIcon: "globe",
  multiple: false,
  clearable: true,
  placeholder: i18next.t(
    'Search for a language by name (e.g "eng", "fr" or "Polish")'
  ),
  required: false,
};
