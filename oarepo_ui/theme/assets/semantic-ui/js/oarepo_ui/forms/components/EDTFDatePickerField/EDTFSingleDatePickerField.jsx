import React, { useState } from "react";
import { useField, useFormikContext } from "formik";
import PropTypes from "prop-types";
import { FieldLabel } from "react-invenio-forms";
import { Form } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  serializeDate,
  deserializeDate,
  getDateFormatStringFromEdtfFormat,
  getInitialEdtfDateFormat,
} from "./utils";
import { EDTFDatePickerWrapper } from "./EDTFDatePickerWrapper";

export const EDTFSingleDatePicker = ({
  fieldPath,
  label,
  helpText,
  required,
  placeholder,
  clearButtonClassName,
  datePickerProps,
  customInputProps,
  icon,
}) => {
  const { setFieldValue } = useFormikContext();
  const [field] = useField(fieldPath);
  const initialEdtfDateFormat = getInitialEdtfDateFormat(field?.value);
  const [dateEdtfFormat, setDateEdtfFormat] = useState(initialEdtfDateFormat);
  const date = field?.value ? deserializeDate(field?.value) : null;
  const handleChange = (date) => {
    setFieldValue(fieldPath, serializeDate(date, dateEdtfFormat));
  };
  const handleClear = () => {
    handleChange(null);
  };
  return (
    <Form.Field className="ui datepicker field" required={required}>
      {label ?? <FieldLabel htmlFor={fieldPath} icon={icon} label={label} />}
      <EDTFDatePickerWrapper
        fieldPath={fieldPath}
        handleClear={handleClear}
        placeholder={placeholder}
        dateEdtfFormat={dateEdtfFormat}
        setDateEdtfFormat={setDateEdtfFormat}
        dateFormat={getDateFormatStringFromEdtfFormat(dateEdtfFormat)}
        clearButtonClassName={clearButtonClassName}
        datePickerProps={{
          selected: date,
          onChange: handleChange,
          ...datePickerProps,
        }}
        customInputProps={customInputProps}
      />
      {helpText && <label className="helptext rel-mt-1">{helpText}</label>}
    </Form.Field>
  );
};

EDTFSingleDatePicker.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  helpText: PropTypes.string,
  datePickerProps: PropTypes.object,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  clearButtonClassName: PropTypes.string,
  customInputProps: PropTypes.object,
  icon: PropTypes.string,
};

EDTFSingleDatePicker.defaultProps = {
  helpText: i18next.t(
    "Choose a date from the calendar by clicking on the input."
  ),
  required: false,
  placeholder: i18next.t("Choose a date."),
  clearButtonClassName: "clear-icon",
  icon: "calendar",
};
