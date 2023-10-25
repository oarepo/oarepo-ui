import * as React from "react";
import { FieldLabel } from "react-invenio-forms";
import { LocalVocabularySelectField } from "@js/oarepo_vocabularies";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";
import { getIn, useFormikContext } from "formik";

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
      label={<FieldLabel htmlFor={fieldPath} icon={labelIcon} label={label} />}
      optionsListName="languages"
      onChange={({ e, data, formikProps }) => {
        formikProps.form.setFieldValue(fieldPath, data.value);
      }}
      value={getIn(values, fieldPath, multiple ? [] : {})}
      {...uiProps}
    />
  );
};

LanguageSelectField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string,
  labelIcon: PropTypes.string,
  required: PropTypes.bool,
  multiple: PropTypes.bool,
  clearable: PropTypes.bool,
  placeholder: PropTypes.string,
  options: PropTypes.array,
};

LanguageSelectField.defaultProps = {
  label: i18next.t("Language"),
  labelIcon: "globe",
  multiple: false,
  search: true,
  clearable: true,
  placeholder: i18next.t(
    'Search for a language by name (e.g "eng", "fr" or "Polish")'
  ),
  required: false,
};
