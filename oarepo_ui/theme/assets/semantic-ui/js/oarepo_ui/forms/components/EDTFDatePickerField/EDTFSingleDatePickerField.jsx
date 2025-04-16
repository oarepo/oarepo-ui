import React, { useState } from "react";
import { useField, useFormikContext } from "formik";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import {
  serializeDate,
  deserializeDate,
  getDateFormatStringFromEdtfFormat,
  getInitialEdtfDateFormat,
} from "./utils";
import { useFieldData } from "../../hooks";
import { EDTFDatePickerWrapper } from "./EDTFDatePickerWrapper";
import { FieldLabel } from "react-invenio-forms";

export const EDTFSingleDatePicker = ({
  fieldPath,
  label,
  helpText,
  required,
  placeholder,
  datePickerProps,
  customInputProps,
  icon = "calendar",
}) => {
  const { setFieldValue } = useFormikContext();
  const { getFieldData } = useFieldData();

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
  const fieldData = {
    ...getFieldData({ fieldPath, icon, fieldRepresentation: "text" }),
    ...(label && { label }),
    ...(required && { required }),
    ...(helpText && { helpText }),
    ...(placeholder && { placeholder }),
  };
  return (
    <Form.Field className="ui datepicker field" required={fieldData.required}>
      <FieldLabel htmlFor={fieldPath} icon={icon} label={fieldData.label} />
      <EDTFDatePickerWrapper
        fieldPath={fieldPath}
        handleClear={handleClear}
        placeholder={fieldData.placeholder}
        dateEdtfFormat={dateEdtfFormat}
        setDateEdtfFormat={setDateEdtfFormat}
        dateFormat={getDateFormatStringFromEdtfFormat(dateEdtfFormat)}
        datePickerProps={{
          selected: date,
          onChange: handleChange,
          ...datePickerProps,
        }}
        customInputProps={customInputProps}
      />
      {fieldData.helpText && (
        <label className="helptext rel-mt-1">{fieldData.helpText}</label>
      )}
    </Form.Field>
  );
};

EDTFSingleDatePicker.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  helpText: PropTypes.string,
  datePickerProps: PropTypes.object,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  customInputProps: PropTypes.object,
  icon: PropTypes.string,
};
