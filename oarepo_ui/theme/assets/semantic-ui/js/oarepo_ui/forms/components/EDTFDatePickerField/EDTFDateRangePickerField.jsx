import React, { useState } from "react";
import { useField, useFormikContext } from "formik";
import PropTypes from "prop-types";
import { FieldLabel } from "react-invenio-forms";
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
  dateRangeInputPlaceholder,
  singleDateInputPlaceholder,
  datePickerPropsOverrides,
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

  const handleSingleDateChange = (date) => {
    dates = [...dates];
    dates = [date, date];
    handleChange(dates);
  };

  const handleClear = () => {
    dates = [...dates];
    dates = [null, null];
    handleChange(dates);
  };

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

  const pickerProps = showSingleDatePicker
    ? {
        selected: startDate,
        onChange: handleSingleDateChange,
      }
    : {
        selected: startDate,
        onChange: handleChange,
        startDate: startDate,
        endDate: endDate,
        selectsRange: true,
      };
  return (
    <Form.Field className="ui datepicker field mb-0" required={required}>
      {label ?? <FieldLabel htmlFor={fieldPath} icon={icon} label={label} />}
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
      <Form.Field>
        <EDTFDatePickerWrapper
          fieldPath={fieldPath}
          handleClear={handleClear}
          placeholder={
            showSingleDatePicker
              ? singleDateInputPlaceholder
              : dateRangeInputPlaceholder
          }
          dateEdtfFormat={dateEdtfFormat}
          setDateEdtfFormat={setDateEdtfFormat}
          dateFormat={dateFormat}
          clearButtonClassName={clearButtonClassName}
          datePickerProps={{ ...pickerProps, ...datePickerPropsOverrides }}
        />
      </Form.Field>
      {helpText && <label className="helptext">{helpText}</label>}
    </Form.Field>
  );
};

EDTFDaterangePicker.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  icon: PropTypes.string,
  helpText: PropTypes.string,
  required: PropTypes.bool,
  clearButtonClassName: PropTypes.string,
  singleDateInputPlaceholder: PropTypes.string,
  dateRangeInputPlaceholder: PropTypes.string,
  datePickerPropsOverrides: PropTypes.object,
};

EDTFDaterangePicker.defaultProps = {
  icon: "calendar",
  helpText: i18next.t(
    "Choose the time interval in which the event took place."
  ),
  required: false,
  clearButtonClassName: "clear-icon",
  singleDateInputPlaceholder: i18next.t("Choose one date."),
  dateRangeInputPlaceholder: i18next.t("Choose date range (From - To)."),
};
