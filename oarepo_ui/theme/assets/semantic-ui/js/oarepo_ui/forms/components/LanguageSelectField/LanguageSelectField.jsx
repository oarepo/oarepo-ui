import * as React from "react";
import { SelectField, FieldLabel } from "react-invenio-forms";
import { useVocabularyOptions } from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useFormikContext } from "formik";
import PropTypes from "prop-types";

export const LanguageSelectField = ({
  fieldPath,
  label,
  labelIcon,
  required,
  multiple,
  placeholder,
  clearable,
  options,
  ...uiProps
}) => {
  const { options: languages } = useVocabularyOptions("languages");

  const { setFieldTouched } = useFormikContext();
  return (
    <SelectField
      onBlur={() => setFieldTouched(fieldPath)}
      fieldPath={fieldPath}
      optimized
      placeholder={placeholder}
      required={required}
      clearable={clearable}
      multiple={multiple}
      options={options ?? languages}
      label={<FieldLabel htmlFor={fieldPath} icon={labelIcon} label={label} />}
      selectOnBlur={false}
      fluid
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
