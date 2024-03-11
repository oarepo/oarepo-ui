import React from "react";
import { useField, useFormikContext } from "formik";
import PropTypes from "prop-types";
import { FieldLabel } from "react-invenio-forms";
import { Form } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { EDTFDatePickerWrapper } from "./EDTFDatePickerWrapper";

export const SingleDatePicker = ({
  fieldPath,
  label,
  icon,
  helpText,
  required,
  placeholder,
  clearButtonClassName,
  datePickerProps,
  customInputProps,
}) => {
  const { setFieldValue } = useFormikContext();
  const [field] = useField(fieldPath);
  const date = field?.value ? new Date(field?.value) : null;
  const handleChange = (date) => {
    setFieldValue(fieldPath, date?.toISOString() ?? "");
  };
  const handleClear = () => {
    handleChange(null);
  };
  return (
    <Form.Field className="ui datepicker field" required={required}>
      <FieldLabel htmlFor={fieldPath} icon={icon} label={label} />
      <EDTFDatePickerWrapper
        fieldPath={fieldPath}
        handleClear={handleClear}
        placeholder={placeholder}
        clearButtonClassName={clearButtonClassName}
        datePickerProps={{
          selected: date,
          onChange: handleChange,
          renderCustomHeader: undefined,
          dateFormat: "PPP",
          ...datePickerProps,
        }}
        helpText={helpText}
        customInputProps={customInputProps}
      />
      <label className="helptext rel-mt-1">{helpText}</label>
    </Form.Field>
  );
};

SingleDatePicker.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  helpText: PropTypes.string,
  datePickerProps: PropTypes.object,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  clearButtonClassName: PropTypes.string,
  customInputProps: PropTypes.object,
};

SingleDatePicker.defaultProps = {
  icon: "calendar",
  helpText: i18next.t(
    "Choose a date from the calendar by clicking on the input."
  ),
  required: false,
  placeholder: i18next.t("Choose a date."),
  clearButtonClassName: "clear-icon",
};
