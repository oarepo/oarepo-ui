import React, { useState } from "react";
import { useField, useFormikContext } from "formik";
import PropTypes from "prop-types";
import { FieldLabel, GroupField } from "react-invenio-forms";
import { Form, Radio } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  allEmptyStrings,
  serializeDate,
  deserializeDate,
  getDateFormatStringFromEdtfFormat,
  getInitialEdtfDateFormat,
} from "./utils";
import { EDTFDatePickerWrapper } from "./EDTFDatePickerWrapper";

export const EDTFDaterangePicker = ({
  fieldPath,
  label,
  icon,
  helpText,
  required,
  clearButtonClassName,
  startDateInputPlaceholder,
  endDateInputPlaceholder,
  singleDateInputPlaceholder,
}) => {
  // TODO: The datepickers shall recieve needed locales from form config (set in Invenio.cfg)
  const { setFieldValue } = useFormikContext();
  const [field] = useField(fieldPath);
  const initialEdtfDateFormat = getInitialEdtfDateFormat(field?.value);
  const [dateEdtfFormat, setDateEdtfFormat] = useState(initialEdtfDateFormat);
  let dates;
  if (field?.value) {
    dates = field.value.split("/").map((date) => deserializeDate(date));
  } else {
    dates = [null, null];
  }

  const [showSingleDatePicker, setShowSingleDatePicker] = useState(
    dates[0] && dates[1] && dates[0].getTime() === dates[1].getTime()
  );

  const dateFormat = getDateFormatStringFromEdtfFormat(dateEdtfFormat);

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

  const handleStartDateChange = (date) => {
    dates = [...dates];
    dates[0] = date;
    handleChange(dates);
  };

  const handleEndDateChange = (date) => {
    dates = [...dates];
    dates[1] = date;
    handleChange(dates);
  };

  const handleSingleDateChange = (date) => {
    dates = [...dates];
    dates = [date, date];
    handleChange(dates);
  };

  const handleClearStartDate = () => {
    dates = [...dates];
    dates[0] = null;
    handleChange(dates);
  };
  const handleClearEndDate = () => {
    dates = [...dates];
    dates[1] = null;
    handleChange(dates);
  };

  const handleClearSingleDate = () => {
    dates = [...dates];
    dates = [null, null];
    handleChange(dates);
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
  return (
    <React.Fragment>
      <Form.Field className="ui datepicker field mb-0" required={required}>
        <FieldLabel htmlFor={fieldPath} icon={icon} label={label} />
        <Form.Field className="mb-0">
          <Radio
            label={i18next.t("Date range.")}
            name="startAndEnd"
            checked={!showSingleDatePicker}
            onChange={() => setShowSingleDatePicker(false)}
            className="rel-mr-1"
          />
          <Radio
            label={i18next.t("Single date.")}
            name="oneDate"
            checked={showSingleDatePicker}
            onChange={() => handleSingleDatePickerSelection()}
            required={false}
          />
        </Form.Field>
        {showSingleDatePicker ? (
          <div>
            <EDTFDatePickerWrapper
              fieldPath={fieldPath}
              handleChange={handleSingleDateChange}
              handleClear={handleClearSingleDate}
              placeholder={singleDateInputPlaceholder}
              dateEdtfFormat={dateEdtfFormat}
              setDateEdtfFormat={setDateEdtfFormat}
              dateFormat={dateFormat}
              clearButtonClassName={clearButtonClassName}
              datePickerProps={{ selected: startDate }}
              helpText={helpText}
            />
          </div>
        ) : (
          <GroupField>
            <EDTFDatePickerWrapper
              fieldPath={fieldPath}
              handleChange={handleStartDateChange}
              handleClear={handleClearStartDate}
              placeholder={startDateInputPlaceholder}
              dateEdtfFormat={dateEdtfFormat}
              setDateEdtfFormat={setDateEdtfFormat}
              dateFormat={dateFormat}
              clearButtonClassName={clearButtonClassName}
              datePickerProps={{
                selected: startDate,
                startDate: startDate,
                endDate: endDate,
                selectsStart: true,
                maxDate: endDate ?? undefined,
              }}
              customInputProps={{ label: i18next.t("From") }}
            />
            <EDTFDatePickerWrapper
              fieldPath={fieldPath}
              handleChange={handleEndDateChange}
              handleClear={handleClearEndDate}
              placeholder={endDateInputPlaceholder}
              dateEdtfFormat={dateEdtfFormat}
              setDateEdtfFormat={setDateEdtfFormat}
              dateFormat={dateFormat}
              clearButtonClassName={clearButtonClassName}
              datePickerProps={{
                selected: endDate,
                startDate: startDate,
                endDate: endDate,
                selectsEnd: true,
                minDate: startDate,
              }}
              customInputProps={{ label: i18next.t("To") }}
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
  icon: PropTypes.string,
  helpText: PropTypes.string,
  required: PropTypes.bool,
  clearButtonClassName: PropTypes.string,
  startDateInputPlaceholder: PropTypes.string,
  endDateInputPlaceholder: PropTypes.string,
  singleDateInputPlaceholder: PropTypes.string,
};

EDTFDaterangePicker.defaultProps = {
  icon: "calendar",
  helpText: i18next.t(
    "Choose the time interval in which the event took place."
  ),
  required: false,
  clearButtonClassName: "clear-icon",
  startDateInputPlaceholder: i18next.t("Starting date"),
  endDateInputPlaceholder: i18next.t("Ending date"),
  singleDateInputPlaceholder: i18next.t("Choose one date"),
};
