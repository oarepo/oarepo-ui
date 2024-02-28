import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { useField, useFormikContext } from "formik";
import { DatePickerHeader } from "./DatePickerHeader";
import PropTypes from "prop-types";
import { FieldLabel, TextField, GroupField } from "react-invenio-forms";
import { Form, Button, Icon } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  edtfDateFormatOptions,
  serializeDate,
  deserializeDate,
  getDateFormatStringFromEdtfFormat,
} from "./utils";
import { useInitialDateEdtfFormat, useLoadLocaleObjects } from "./hooks";

export const EDTFSingleDatePicker = ({
  fieldPath,
  label,
  htmlFor,
  icon,
  helpText,
  required,
  placeholder,
  calendarControlButtonClassName,
  calendarControlIconName,
  clearButtonClassName,
  ...datePickerProps
}) => {
  const { setFieldValue } = useFormikContext();
  const [field] = useField(fieldPath);
  const [dateEdtfFormat, setDateEdtfFormat] = useInitialDateEdtfFormat(
    field?.value
  );
  const date = field?.value ? deserializeDate(field?.value) : null;
  const handleChange = (date) => {
    setFieldValue(fieldPath, serializeDate(date, dateEdtfFormat));
  };
  useLoadLocaleObjects();
  return (
    <div className="ui datepicker field">
      <Form.Field className="ui datepicker field">
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
          isClearable={date !== null}
          autoComplete="off"
          dateFormat={getDateFormatStringFromEdtfFormat(dateEdtfFormat)}
          calendarControlButtonClassName={calendarControlButtonClassName}
          calendarControlIconName={calendarControlIconName}
          clearButtonClassName={clearButtonClassName}
          showPopperArrow={false}
          {...datePickerProps}
        />
        <label className="helptext">{helpText}</label>
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
  calendarControlButtonClassName: PropTypes.string,
  calendarControlIconName: PropTypes.string,
  clearButtonClassName: PropTypes.string,
};

EDTFSingleDatePicker.defaultProps = {
  icon: "calendar",
  helpText: i18next.t("Format: YYYY-MM-DD, YYYYY-MM or YYYY."),
  required: false,
  placeholder: i18next.t(
    "Write a date or click on the calendar icon to select it"
  ),
  calendarControlButtonClassName: "calendar-control-button",
  calendarControlIconName: "calendar",
  clearButtonClassName: "clear-icon",
};
