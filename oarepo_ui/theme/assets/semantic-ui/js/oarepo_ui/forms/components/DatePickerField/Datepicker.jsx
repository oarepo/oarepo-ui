import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useField, useFormikContext } from "formik";
import { DatePickerHeader } from "./DatePickerHeader";
import PropTypes from "prop-types";
import { FieldLabel } from "react-invenio-forms";
import { Form } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";

const edtfDateFormatOptions = [
  { value: "yyyy", text: "YYYY" },
  { value: "yyyy-MM", text: "YYYY-MM" },
  { value: "yyyy-MM-dd", text: "YYYY-MM-DD" },
];

const useInitialDateFormat = (fieldValue) => {
  let dateFormat;
  if (fieldValue) {
    const value = fieldValue.includes("/")
      ? fieldValue.split("/")[0]
      : fieldValue;
    if (value.length === 4) {
      dateFormat = "yyyy";
    } else if (value.length === 7) {
      dateFormat = "yyyy-MM";
    } else {
      dateFormat = "yyyy-MM-dd";
    }
  } else {
    dateFormat = "yyyy-MM-dd";
  }

  const [initialDateFormat, setInitialDateFormat] = useState(dateFormat);
  return [initialDateFormat, setInitialDateFormat];
};

const allEmptyStrings = (arr) => arr.every((element) => element === "");

const serializeDate = (dateObj, dateFormat) => {
  if (dateObj === null) return "";
  const pad = (value) => (value < 10 ? `0${value}` : value);

  if (dateFormat === "yyyy") return `${dateObj.getFullYear()}`;
  if (dateFormat === "yyyy-MM")
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}`;
  if (dateFormat === "yyyy-MM-dd")
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(
      dateObj.getDate()
    )}`;
};

const deserializeDate = (edtfDateString) => {
  if (edtfDateString) {
    return new Date(edtfDateString);
  } else {
    return null;
  }
};

export const DaterangePicker = ({
  fieldPath,
  label,
  htmlFor,
  icon,
  helpText,
  required,
  ...datePickerProps
}) => {
  const { setFieldValue } = useFormikContext();
  const [field, meta] = useField(fieldPath);
  const [dateFormat, setDateFormat] = useInitialDateFormat(field?.value);
  let dates;

  if (field?.value) {
    dates = field.value.split("/").map((date) => deserializeDate(date));
  } else {
    dates = [null, null];
  }

  const onChange = (dates) => {
    const serializedDates = dates.map((date) =>
      serializeDate(date, dateFormat)
    );
    if (allEmptyStrings(serializedDates)) {
      setFieldValue(fieldPath, "");
    } else {
      setFieldValue(fieldPath, serializedDates.join("/"));
    }
  };
  return (
    <React.Fragment>
      <Form.Input
        className="datepicker-wrapper-SUI-input"
        error={meta.error}
        required={required}
        label={<FieldLabel htmlFor={htmlFor} icon={icon} label={label} />}
      >
        <DatePicker
          {...field}
          isClearable
          selected={dates[0] ?? null}
          startDate={dates[0] ?? null}
          endDate={dates[1] ?? null}
          onChange={onChange}
          showYearPicker={dateFormat === "yyyy"}
          showMonthYearPicker={dateFormat === "yyyy-MM"}
          dateFormat={dateFormat}
          selectsRange={true}
          autoComplete="off"
          renderCustomHeader={(props) => (
            <DatePickerHeader
              dateFormat={dateFormat}
              setDateFormat={setDateFormat}
              edtfDateFormatOptions={edtfDateFormatOptions}
              {...props}
            />
          )}
          {...datePickerProps}
          className="datepicker-input"
        />
      </Form.Input>
      {helpText && <label className="helptext">{helpText}</label>}
    </React.Fragment>
  );
};

DaterangePicker.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  icon: PropTypes.string,
  helpText: PropTypes.string,
  datePickerProps: PropTypes.object,
  required: PropTypes.bool,
};

DaterangePicker.defaultProps = {
  icon: "calendar",
  helpText: i18next.t(
    "Write down the time period in which the data collection took place/took place. If it is not a range, choose same date twice."
  ),
  required: false,
};

export const SingleDatePicker = ({
  fieldPath,
  label,
  htmlFor,
  icon,
  helpText,
  required,
  ...datePickerProps
}) => {
  const { setFieldValue } = useFormikContext();
  const [field, meta] = useField(fieldPath);
  const [dateFormat, setDateFormat] = useInitialDateFormat(field?.value);

  const onChange = (dates) => {
    setFieldValue(fieldPath, serializeDate(dates, dateFormat));
  };

  return (
    <React.Fragment>
      <Form.Input
        className="datepicker-wrapper-SUI-input"
        error={meta.error}
        required={required}
        label={<FieldLabel htmlFor={fieldPath} icon={icon} label={label} />}
      >
        <DatePicker
          {...field}
          selected={
            deserializeDate(field?.value) ? deserializeDate(field?.value) : null
          }
          isClearable
          onChange={onChange}
          showYearPicker={dateFormat === "yyyy"}
          showMonthYearPicker={dateFormat === "yyyy-MM"}
          dateFormat={dateFormat}
          selectsRange={false}
          autoComplete="off"
          renderCustomHeader={(props) => (
            <DatePickerHeader
              dateFormat={dateFormat}
              setDateFormat={setDateFormat}
              edtfDateFormatOptions={edtfDateFormatOptions}
              {...props}
            />
          )}
          {...datePickerProps}
          className="datepicker-input"
        />
      </Form.Input>
      {helpText && <label className="helptext">{helpText}</label>}
    </React.Fragment>
  );
};

SingleDatePicker.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  icon: PropTypes.string,
  helpText: PropTypes.string,
  datePickerProps: PropTypes.object,
  required: PropTypes.bool,
};

SingleDatePicker.defaultProps = {
  icon: "calendar",
  helpText: i18next.t(
    "If the dataset has been published elsewhere, use the date of first publication. You can also specify a future publication date (for embargo). If you do not enter a date, the system will automatically fill the date when the record is published. Format: YYYY-MM-DD, YYYYY-MM or YYYYY."
  ),
  required: false,
};
