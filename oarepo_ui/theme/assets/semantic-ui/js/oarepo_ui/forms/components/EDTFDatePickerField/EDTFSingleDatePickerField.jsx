import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { useField, useFormikContext } from "formik";
import { DatePickerHeader } from "./DatePickerHeader";
import PropTypes from "prop-types";
import { FieldLabel } from "react-invenio-forms";
import { Form } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  edtfDateFormatOptions,
  serializeDate,
  deserializeDate,
  getDateFormatStringFromEdtfFormat,
  getInitialEdtfDateFormat,
} from "./utils";
import { useLoadLocaleObjects } from "./hooks";
import { InputElement } from "./InputElement";

export const EDTFSingleDatePicker = ({
  fieldPath,
  label,
  htmlFor,
  icon,
  helpText,
  required,
  placeholder,
  clearButtonClassName,
  ...datePickerProps
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
  useLoadLocaleObjects();
  return (
    <div className="ui datepicker field">
      <Form.Field className="ui datepicker field" required={required}>
        <FieldLabel htmlFor={fieldPath} icon={icon} label={label} />
        <DatePicker
          locale={i18next.language}
          selected={date}
          onChange={(date) => {
            handleChange(date);
          }}
          renderCustomHeader={(props) => (
            <DatePickerHeader
              dateEdtfFormat={dateEdtfFormat}
              setDateEdtfFormat={setDateEdtfFormat}
              edtfDateFormatOptions={edtfDateFormatOptions}
              {...props}
            />
          )}
          showYearPicker={dateEdtfFormat === "yyyy"}
          showMonthYearPicker={dateEdtfFormat === "yyyy-mm"}
          autoComplete="off"
          dateFormat={getDateFormatStringFromEdtfFormat(dateEdtfFormat)}
          clearButtonClassName={clearButtonClassName}
          showPopperArrow={false}
          customInput={
            <InputElement
              handleClear={handleClear}
              fieldPath={fieldPath}
              clearButtonClassName={clearButtonClassName}
            />
          }
          placeholderText={placeholder}
          {...datePickerProps}
        />
        <label className="helptext rel-mt-1">{helpText}</label>
      </Form.Field>
    </div>
  );
};

EDTFSingleDatePicker.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  icon: PropTypes.string,
  helpText: PropTypes.string,
  datePickerProps: PropTypes.object,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  clearButtonClassName: PropTypes.string,
};

EDTFSingleDatePicker.defaultProps = {
  icon: "calendar",
  helpText: i18next.t(
    "Choose a date from the calendar by clicking on the input."
  ),
  required: false,
  placeholder: i18next.t("Choose a date."),
  clearButtonClassName: "clear-icon",
};
