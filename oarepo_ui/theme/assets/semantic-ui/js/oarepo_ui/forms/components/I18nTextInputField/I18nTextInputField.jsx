import * as React from "react";
import {
  LanguageSelectField,
  useFormConfig,
  useFieldData,
} from "@js/oarepo_ui";
import { TextField, GroupField, FieldLabel } from "react-invenio-forms";
import PropTypes from "prop-types";

export const I18nTextInputField = ({
  fieldPath,
  label,
  required,
  optimized,
  labelIcon,
  placeholder,
  lngFieldWidth,
  usedLanguages,
  useModelData,
  ...uiProps
}) => {
  const { getFieldData } = useFieldData();

  return (
    <GroupField fieldPath={fieldPath} optimized>
      <LanguageSelectField
        fieldPath={`${fieldPath}.lang`}
        placeholder=""
        required
        width={lngFieldWidth}
        usedLanguages={usedLanguages}
        {...(useModelData
          ? getFieldData(`${fieldPath}.lang`, "web").compactRepresentation
          : {})}
      />
      <TextField
        // TODO: hacky fix for SUI alignment bug for case with
        // field groups with empty field label on one of inputs
        className={`${!label ? "mt-20" : ""}`}
        fieldPath={`${fieldPath}.value`}
        label={
          <FieldLabel
            htmlFor={`${fieldPath}.value`}
            icon={labelIcon}
            label={label}
          />
        }
        required={required}
        optimized={optimized}
        placeholder={placeholder}
        width={13}
        {...(useModelData
          ? getFieldData(`${fieldPath}.value`, "web").compactRepresentation
          : {})}
        {...uiProps}
      />
    </GroupField>
  );
};

I18nTextInputField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string,
  labelIcon: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  error: PropTypes.any,
  helpText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  disabled: PropTypes.bool,
  optimized: PropTypes.bool,
  languageOptions: PropTypes.array,
  lngFieldWidth: PropTypes.number,
  usedLanguages: PropTypes.array,
  useModelData: PropTypes.bool,
};

I18nTextInputField.defaultProps = {
  label: undefined,
  labelIcon: undefined,
  placeholder: undefined,
  error: undefined,
  helpText: "",
  disabled: false,
  optimized: true,
  required: false,
  lngFieldWidth: 3,
  useModelData: true,
};
