import React, { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { useField, useFormikContext } from "formik";
import { DatePickerHeader } from "./DatePickerHeader";
import PropTypes from "prop-types";
import { FieldLabel, TextField, GroupField } from "react-invenio-forms";
import { Form, Button, Icon, Checkbox, Popup } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  edtfDateFormatOptions,
  allEmptyStrings,
  serializeDate,
  deserializeDate,
  getDateFormatStringFromEdtfFormat,
} from "./utils";
import { useInitialDateEdtfFormat, useLoadLocaleObjects } from "./hooks";
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
  clearButtonClassName,
  startDateInputPlaceholder,
  endDateInputPlaceholder,
  oneDateInputPlaceholder,
  ...datePickerProps
}) => {
  const { setFieldValue } = useFormikContext();
  const [field] = useField(fieldPath);
  const [dateEdtfFormat, setDateEdtfFormat] = useInitialDateEdtfFormat(
    field?.value
  );
  const [showSingleDatePicker, setShowSingleDatePicker] = useState(false);

  let dates;

  if (field?.value) {
    dates = field.value.split("/").map((date) => deserializeDate(date));
  } else {
    dates = [null, null];
  }

  const startDate = dates[0];
  const endDate = dates[1];

  const handleChange = (dates) => {
    const serializedDates = dates.map((date) =>
      serializeDate(date, dateEdtfFormat)
    );
    if (allEmptyStrings(serializedDates)) {
      setFieldValue(fieldPath, "");
    } else {
      setFieldValue(fieldPath, serializedDates.join("/"));
    }
  };

  const handleSingleDateChange = (date) => {
    handleChange([date, date]);
  };
  useLoadLocaleObjects();

  return (
    <Form.Field className="ui datepicker field">
      <FieldLabel htmlFor={fieldPath} icon={icon} label={label} />
      <Checkbox
        checked={showSingleDatePicker}
        onChange={() => setShowSingleDatePicker(!showSingleDatePicker)}
        label={i18next.t("Select one date only")}
      />
      <Popup
        content={i18next.t(
          "Check this box if start and end date are the same."
        )}
        trigger={<Icon name="question circle outline" className="ml-5"></Icon>}
      />
      {showSingleDatePicker ? (
        <div>
          <DatePicker
            locale={i18next.language}
            selected={startDate}
            onChange={(date) => {
              handleSingleDateChange(date);
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
            isClearable={startDate !== null}
            autoComplete="off"
            dateFormat={getDateFormatStringFromEdtfFormat(dateEdtfFormat)}
            calendarControlButtonClassName={calendarControlButtonClassName}
            calendarControlIconName={calendarControlIconName}
            clearButtonClassName={clearButtonClassName}
            placeholder={oneDateInputPlaceholder}
            showPopperArrow={false}
            {...datePickerProps}
          />
        </div>
      ) : (
        <GroupField>
          <DatePicker
            locale={i18next.language}
            selected={startDate}
            onChange={(date) => {
              dates[0] = date;
              handleChange(dates);
            }}
            selectsStart
            startDate={startDate}
            endDate={endDate}
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
            isClearable={startDate !== null}
            autoComplete="off"
            dateFormat={getDateFormatStringFromEdtfFormat(dateEdtfFormat)}
            maxDate={endDate ?? endDate}
            calendarControlButtonClassName={calendarControlButtonClassName}
            calendarControlIconName={calendarControlIconName}
            clearButtonClassName={clearButtonClassName}
            placeholder={startDateInputPlaceholder}
            showPopperArrow={false}
            {...datePickerProps}
          />
          <DatePicker
            locale={i18next.language}
            selected={endDate}
            onChange={(date) => {
              dates[1] = date;
              handleChange(dates);
            }}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            renderCustomHeader={(props) => (
              <DatePickerHeader
                dateEdtfFormat={dateEdtfFormat}
                setdateEdtfFormat={setDateEdtfFormat}
                edtfDateFormatOptions={edtfDateFormatOptions}
                {...props}
              />
            )}
            showYearPicker={dateEdtfFormat === "yyyy"}
            showMonthYearPicker={dateEdtfFormat === "yyyy-mm"}
            isClearable={endDate !== null}
            autoComplete="off"
            dateFormat={getDateFormatStringFromEdtfFormat(dateEdtfFormat)}
            calendarControlButtonClassName={calendarControlButtonClassName}
            calendarControlIconName={calendarControlIconName}
            clearButtonClassName={clearButtonClassName}
            placeholder={endDateInputPlaceholder}
            showPopperArrow={false}
            {...datePickerProps}
          />
        </GroupField>
      )}
      <label className="helptext">{helpText}</label>
    </Form.Field>
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
  clearButtonClassName: PropTypes.string,
  startDateInputPlaceholder: PropTypes.string,
  endDateInputPlaceholder: PropTypes.string,
  oneDateInputPlaceholder: PropTypes.string,
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
  clearButtonClassName: "clear-icon",
};
