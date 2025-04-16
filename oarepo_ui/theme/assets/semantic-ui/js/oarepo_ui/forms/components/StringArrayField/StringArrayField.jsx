import React from "react";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useFormikContext, getIn, FieldArray } from "formik";
import { Icon, Form, Label } from "semantic-ui-react";
import { ArrayFieldItem } from "../ArrayFieldItem";
import { useFieldData, useShowEmptyValue } from "../../hooks";
import { TextField } from "../TextField";
import { FieldLabel } from "react-invenio-forms";

export const StringArrayField = ({
  fieldPath,
  label,
  required,
  defaultNewValue = "",
  addButtonLabel = i18next.t("Add"),
  helpText,
  labelIcon,
  showEmptyValue = false,
  icon,
  fieldRepresentation = "text",
  ...uiProps
}) => {
  const { values, errors } = useFormikContext();
  const { getFieldData } = useFieldData();

  const fieldData = {
    ...getFieldData({ fieldPath, icon, fieldRepresentation }),
    ...(label && { label }),
    ...(required && { required }),
    ...(helpText && { helpText }),
  };
  useShowEmptyValue(fieldPath, defaultNewValue, showEmptyValue);
  const fieldError = getIn(errors, fieldPath, null);
  return (
    <Form.Field required={required}>
      <FieldLabel htmlFor={fieldPath} icon={icon} label={fieldData.label} />
      <FieldArray
        name={fieldPath}
        render={(arrayHelpers) => (
          <React.Fragment>
            {getIn(values, fieldPath, []).map((item, index) => {
              const indexPath = `${fieldPath}.${index}`;
              const textInputError = Array.isArray(fieldError)
                ? fieldError[index]
                : fieldError;
              return (
                <ArrayFieldItem
                  key={index}
                  indexPath={index}
                  arrayHelpers={arrayHelpers}
                  fieldPathPrefix={indexPath}
                >
                  <TextField
                    fieldPath={indexPath}
                    label={`#${index + 1}`}
                    error={textInputError}
                    width={16}
                    {...uiProps}
                  />
                </ArrayFieldItem>
              );
            })}
            {fieldData.helpText ? (
              <label className="helptext">{fieldData.helpText}</label>
            ) : null}
            <Form.Button
              className="array-field-add-button inline"
              type="button"
              icon
              labelPosition="left"
              onClick={() => {
                arrayHelpers.push(defaultNewValue);
              }}
            >
              <Icon name="add" />
              {addButtonLabel}
            </Form.Button>
          </React.Fragment>
        )}
      />
      {fieldError && typeof fieldError == "string" && (
        <Label pointing="left" prompt>
          {fieldError}
        </Label>
      )}
    </Form.Field>
  );
};

StringArrayField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  defaultNewValue: PropTypes.string,
  addButtonLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  helpText: PropTypes.string,
  labelIcon: PropTypes.string,
  required: PropTypes.bool,
  showEmptyValue: PropTypes.bool,
  icon: PropTypes.string,
  fieldRepresentation: PropTypes.string,
};
