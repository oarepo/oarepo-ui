import * as React from "react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";
import { useFormikContext, getIn } from "formik";
import { useFormConfig } from "../../hooks";
import { SelectField } from "react-invenio-forms";

export const LanguageSelectField = ({
  fieldPath,
  label = i18next.t("Language"),
  labelIcon = "globe",
  required = false,
  placeholder = i18next.t(
    'Search for a language by name (e.g "eng", "fr" or "Polish")'
  ),
  clearable = true,
  usedLanguages = [],
  ...uiProps
}) => {
  const { values } = useFormikContext();
  const value = getIn(values, fieldPath, "") ?? "";
  const { multilingualFieldLanguages } = useFormConfig();

  return (
    <SelectField
      deburr
      options={multilingualFieldLanguages.filter(
        (o) => !usedLanguages.includes(o.value) || o.value === value
      )}
      fieldPath={fieldPath}
      placeholder={placeholder}
      required={required}
      clearable={clearable}
      multiple={false}
      label={label}
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
  clearable: PropTypes.bool,
  placeholder: PropTypes.string,
  usedLanguages: PropTypes.array,
  /* eslint-enable react/require-default-props */
};
