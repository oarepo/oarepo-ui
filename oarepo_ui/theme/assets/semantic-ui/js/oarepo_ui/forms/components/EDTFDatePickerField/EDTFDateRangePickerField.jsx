import React, { useState } from "react";
import DatePicker from "react-datepicker";
import { useField, useFormikContext } from "formik";
import { DatePickerHeader } from "./DatePickerHeader";
import PropTypes from "prop-types";
import { FieldLabel, GroupField } from "react-invenio-forms";
import { Form, Radio } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  edtfDateFormatOptions,
  allEmptyStrings,
  serializeDate,
  deserializeDate,
  getDateFormatStringFromEdtfFormat,
} from "./utils";
import { useInitialDateEdtfFormat, useLoadLocaleObjects } from "./hooks";
import { InputElement } from "./InputElement";

export const EDTFDaterangePicker = ({
  fieldPath,
  label,
  htmlFor,
  icon,
  helpText,
  required,
  clearButtonClassName,
  startDateInputPlaceholder,
  endDateInputPlaceholder,
  singleDateInputPlaceholder,
  ...datePickerProps
}) => {
  // TODO: The datepickers shall recieve needed locales from form config (set in Invenio.cfg)
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

  const handleClearStartDate = () => {
    dates[0] = null;
    handleChange(dates);
  };
  const handleClearEndDate = () => {
    dates[1] = null;
    handleChange(dates);
  };

  const handleClearSingleDate = () => {
    handleChange([null, null]);
  };
  // handle situation if someone selected just one date, when switching to the single input
  // to fill it with one of the selected values
  const handleSingleDatePickerSelection = () => {
    if (!dates[0] && dates[1]) {
      const newDates = [dates[1], dates[1]].map((date) =>
        serializeDate(date, dateEdtfFormat)
      );
      setFieldValue(fieldPath, newDates.join("/"));
    } else if (!dates[1] && dates[0]) {
      const newDates = [dates[0], dates[0]].map((date) =>
        serializeDate(date, dateEdtfFormat)
      );
      setFieldValue(fieldPath, newDates.join("/"));
    }
    setShowSingleDatePicker(true);
  };
  useLoadLocaleObjects();
  return (
    <React.Fragment>
      <Form.Field className="ui datepicker field mb-0" required={required}>
        <FieldLabel htmlFor={fieldPath} icon={icon} label={label} />
        <Form.Field className="mb-0">
          <Radio
            label={i18next.t("Choose start and end date.")}
            name="startAndEnd"
            checked={!showSingleDatePicker}
            onChange={() => setShowSingleDatePicker(false)}
            className="rel-mr-1"
          />
          <Radio
            label={i18next.t("Choose one date as start and end date.")}
            name="oneDate"
            checked={showSingleDatePicker}
            onChange={() => handleSingleDatePickerSelection()}
            required={false}
          />
        </Form.Field>
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
              autoComplete="off"
              dateFormat={getDateFormatStringFromEdtfFormat(dateEdtfFormat)}
              clearButtonClassName={clearButtonClassName}
              placeholderText={singleDateInputPlaceholder}
              showPopperArrow={false}
              customInput={
                <InputElement
                  handleClear={handleClearSingleDate}
                  fieldPath={fieldPath}
                  clearButtonClassName={clearButtonClassName}
                />
              }
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
              autoComplete="off"
              dateFormat={getDateFormatStringFromEdtfFormat(dateEdtfFormat)}
              maxDate={endDate ?? endDate}
              clearButtonClassName={clearButtonClassName}
              showPopperArrow={false}
              placeholderText={startDateInputPlaceholder}
              customInput={
                <InputElement
                  handleClear={handleClearStartDate}
                  fieldPath={fieldPath}
                  clearButtonClassName={clearButtonClassName}
                  label={i18next.t("From")}
                />
              }
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
              placeholderText={endDateInputPlaceholder}
              showPopperArrow={false}
              customInput={
                <InputElement
                  handleClear={handleClearEndDate}
                  fieldPath={fieldPath}
                  clearButtonClassName={clearButtonClassName}
                  label={i18next.t("To")}
                  placeholder={endDateInputPlaceholder}
                />
              }
              {...datePickerProps}
            />
          </GroupField>
        )}
      </Form.Field>
      <label className="helptext">{helpText}</label>
    </React.Fragment>
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
  clearButtonClassName: PropTypes.string,
  startDateInputPlaceholder: PropTypes.string,
  endDateInputPlaceholder: PropTypes.string,
  singleDateInputPlaceholder: PropTypes.string,
};

EDTFDaterangePicker.defaultProps = {
  icon: "calendar",
  helpText: i18next.t(
    "Choose the time interval in which the event took place. If start and end date are the same, choose same date twice.You can also use the button above to select just the one date."
  ),
  required: false,
  clearButtonClassName: "clear-icon",
  startDateInputPlaceholder: i18next.t("Starting date"),
  endDateInputPlaceholder: i18next.t("Ending date"),
  singleDateInputPlaceholder: i18next.t("Choose one date"),
};
