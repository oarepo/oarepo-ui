import * as React from "react";
import { i18next } from "@translations/oarepo_ui/i18next";
import PropTypes from "prop-types";
import { useFormikContext, getIn } from "formik";
import { useFormConfig } from "../../hooks";
import { SelectField } from "react-invenio-forms";
import { serializer } from "./util";

// Keep for oarepo-vocabularies form and potentially maybe some other use cases where
// it will be necessary to use 2 character language codes
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
  const {
    config: { multilingualFieldLanguages = [] },
  } = useFormConfig();

  return (
    <SelectField
      deburr
      options={serializer(multilingualFieldLanguages)?.filter(
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
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  labelIcon: PropTypes.string,
  required: PropTypes.bool,
  clearable: PropTypes.bool,
  placeholder: PropTypes.string,
  usedLanguages: PropTypes.array,
};
