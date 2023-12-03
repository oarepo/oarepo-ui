import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useField, useFormikContext } from "formik";
import { DatePickerHeader } from "./DatePickerHeader";
import PropTypes from "prop-types";
import { FieldLabel, TextField, GroupField } from "react-invenio-forms";
import { Form, Button, Icon } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import _padStart from "lodash/padStart";
import isBefore from "date-fns/isBefore";

const edtfDateFormatOptions = [
  { value: "yyyy", text: i18next.t("YYYY") },
  { value: "yyyy-mm", text: i18next.t("YYYY-MM") },
  { value: "yyyy-mm-dd", text: i18next.t("YYYY-MM-DD") },
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
      dateFormat = "yyyy-mm";
    } else {
      dateFormat = "yyyy-mm-dd";
    }
  } else {
    dateFormat = "yyyy-mm-dd";
  }

  const [initialDateFormat, setInitialDateFormat] = useState(dateFormat);
  return [initialDateFormat, setInitialDateFormat];
};

const allEmptyStrings = (arr) => arr.every((element) => element === "");

const serializeDate = (dateObj, dateFormat) => {
  if (dateObj === null) return "";

  if (dateFormat === "yyyy") return `${dateObj.getFullYear()}`;
  if (dateFormat === "yyyy-mm")
    return `${dateObj.getFullYear()}-${_padStart(
      dateObj.getMonth() + 1,
      2,
      "0"
    )}`;
  if (dateFormat === "yyyy-mm-dd")
    return `${dateObj.getFullYear()}-${_padStart(
      dateObj.getMonth() + 1,
      2,
      "0"
    )}-${_padStart(dateObj.getDate(), 2, "0")}`;
};

const deserializeDate = (edtfDateString) => {
  if (edtfDateString) {
    try {
      const dateObject = new Date(edtfDateString);
      // Check if the dateObject is valid
      if (isNaN(dateObject.getTime())) {
        throw new Error("Invalid date string");
      }
      return dateObject;
    } catch (error) {
      return null;
    }
  } else {
    return null;
  }
};

export const EDTFDaterangePicker = ({
  fieldPath,
  label,
  htmlFor,
  icon,
  helpText,
  required,
  placeholder,
  calendarControlButtonClassName,
  calendarControlIconName,
  clearIconClassName,
  ...datePickerProps
}) => {
  const { setFieldValue } = useFormikContext();
  const [field] = useField(fieldPath);
  const [dateFormat, setDateFormat] = useInitialDateFormat(field?.value);
  let dates;

  const handleSelect = (date) => {
    if (dates[0] && !dates[1] && !isBefore(date, dates[0])) {
      setIsOpen(false);
    }
  };

  if (field?.value) {
    dates = field.value.split("/").map((date) => deserializeDate(date));
  } else {
    dates = [null, null];
  }

  const handleChange = (dates) => {
    const serializedDates = dates.map((date) =>
      serializeDate(date, dateFormat)
    );
    if (allEmptyStrings(serializedDates)) {
      setFieldValue(fieldPath, "");
    } else {
      setFieldValue(fieldPath, serializedDates.join("/"));
    }
  };

  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <div className="ui datepicker field">
      <GroupField>
        <TextField
          width={15}
          fieldPath={fieldPath}
          required={required}
          label={<FieldLabel htmlFor={fieldPath} icon={icon} label={label} />}
          autoComplete="off"
          placeholder={placeholder}
          icon={
            field?.value ? (
              <Icon
                className={clearIconClassName}
                name="close"
                onClick={() => setFieldValue(fieldPath, "")}
              />
            ) : null
          }
          iconPosition="right"
        />
        {isOpen && (
          <DatePicker
            open={isOpen}
            onSelect={handleSelect}
            className="datepicker-input"
            selected={dates[0] ?? null}
            startDate={dates[0] ?? null}
            endDate={dates[1] ?? null}
            onChange={handleChange}
            showYearPicker={dateFormat === "yyyy"}
            showMonthYearPicker={dateFormat === "yyyy-mm"}
            dateFormat={dateFormat}
            selectsRange={true}
            renderCustomHeader={(props) => (
              <DatePickerHeader
                dateFormat={dateFormat}
                setDateFormat={setDateFormat}
                edtfDateFormatOptions={edtfDateFormatOptions}
                {...props}
              />
            )}
            {...datePickerProps}
          />
        )}
        <Form.Field>
          <Button
            aria-label={i18next.t("Choose a date range")}
            className={calendarControlButtonClassName}
            icon
            onClick={handleClick}
            type="button"
          >
            <Icon name={calendarControlIconName} size="big" />
          </Button>
        </Form.Field>
      </GroupField>
      <label className="helptext">{helpText}</label>
    </div>
  );
};

EDTFDaterangePicker.propTypes = {
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
  clearIconClassName: PropTypes.string,
};

EDTFDaterangePicker.defaultProps = {
  icon: "calendar",
  helpText: i18next.t(
    "Format: YYYY-MM-DD/YYYY-MM-DD, YYYYY-MM/YYYY/MM or YYYY/YYYY."
  ),
  required: false,
  placeholder: i18next.t(
    "Write a date range or click on the calendar icon to select it"
  ),
  calendarControlButtonClassName: "calendar-control-button",
  calendarControlIconName: "calendar",
  clearIconClassName: "clear-icon",
};

export const EDTFSingleDatePicker = ({
  fieldPath,
  label,
  htmlFor,
  icon,
  helpText,
  required,
  placeholderText,
  calendarControlButtonClassName,
  calendarControlIconName,
  clearIconClassName,
  ...datePickerProps
}) => {
  const { setFieldValue } = useFormikContext();
  const [field] = useField(fieldPath);
  const [dateFormat, setDateFormat] = useInitialDateFormat(field?.value);

  const handleChange = (date) => {
    setFieldValue(fieldPath, serializeDate(date, dateFormat));
    setIsOpen(!isOpen);
  };

  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <div className="ui datepicker field">
      <GroupField>
        <TextField
          width={15}
          fieldPath={fieldPath}
          required={required}
          autoComplete="off"
          label={<FieldLabel htmlFor={fieldPath} icon={icon} label={label} />}
          icon={
            field?.value ? (
              <Icon
                className={clearIconClassName}
                name="close"
                onClick={() => setFieldValue(fieldPath, "")}
              />
            ) : null
          }
        />
        {isOpen && (
          <DatePicker
            open={isOpen}
            shouldCloseOnSelect={true}
            selected={field?.value ? deserializeDate(field?.value) : null}
            className="datepicker-input"
            isClearable
            onChange={handleChange}
            showYearPicker={dateFormat === "yyyy"}
            showMonthYearPicker={dateFormat === "yyyy-mm"}
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
            placeholderText={placeholderText}
            {...datePickerProps}
          />
        )}
        <Form.Field>
          <Button
            aria-label={i18next.t("Choose a date range")}
            className={calendarControlButtonClassName}
            icon
            onClick={handleClick}
            type="button"
          >
            <Icon name={calendarControlIconName} size="big" />
          </Button>
        </Form.Field>
      </GroupField>
      <label className="helptext">{helpText}</label>
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
  placeholderText: PropTypes.string,
  calendarControlButtonClassName: PropTypes.string,
  calendarControlIconName: PropTypes.string,
  clearIconClassName: PropTypes.string,
};

EDTFSingleDatePicker.defaultProps = {
  icon: "calendar",
  helpText: i18next.t("Format: YYYY-MM-DD, YYYYY-MM or YYYY."),
  required: false,
  placeholderText: i18next.t(
    "Write a date or click on the calendar icon to select it"
  ),
  calendarControlButtonClassName: "calendar-control-button",
  calendarControlIconName: "calendar",
  clearIconClassName: "clear-icon",
};
