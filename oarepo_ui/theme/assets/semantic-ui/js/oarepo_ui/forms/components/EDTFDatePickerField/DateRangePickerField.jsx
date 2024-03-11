import React, { useState } from "react";
import { useField, useFormikContext } from "formik";
import PropTypes from "prop-types";
import { FieldLabel } from "react-invenio-forms";
import { Form, Radio } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { EDTFDatePickerWrapper } from "./EDTFDatePickerWrapper";

export const DateRangePicker = ({
  fieldPath,
  label,
  icon,
  helpText,
  required,
  clearButtonClassName,
  dateRangeInputPlaceholder,
  singleDateInputPlaceholder,
  datePickerPropsOverrides,
  startDateKey,
  endDateKey,
}) => {
  // TODO: The datepickers shall recieve needed locales from form config (set in Invenio.cfg)
  const { setFieldValue } = useFormikContext();
  const [field] = useField(fieldPath);

  let dates;
  if (field?.value) {
    dates = [
      field.value[startDateKey] ? new Date(field.value[startDateKey]) : null,
      field.value[endDateKey] ? new Date(field.value[endDateKey]) : null,
    ];
  } else {
    dates = [null, null];
  }

  const [showSingleDatePicker, setShowSingleDatePicker] = useState(
    dates[0] && dates[1] && dates[0].getTime() === dates[1].getTime()
  );

  const startDate = dates[0];
  const endDate = dates[1];

  const handleChange = (dates) => {
    setFieldValue(fieldPath, {
      [startDateKey]: dates[0]?.toISOString() ?? "",
      [endDateKey]: dates[1]?.toISOString() ?? "",
    });
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
      setFieldValue(fieldPath, {
        [startDateKey]: dates[1]?.toISOString(),
        [endDateKey]: dates[1]?.toISOString(),
      });
    } else if (!dates[1] && dates[0]) {
      setFieldValue(fieldPath, {
        [startDateKey]: dates[0]?.toISOString(),
        [endDateKey]: dates[0]?.toISOString(),
      });
    }
    setShowSingleDatePicker(true);
  };

  const pickerProps = showSingleDatePicker
    ? {
        selected: startDate,
        onChange: handleSingleDateChange,
        renderCustomHeader: undefined,
      }
    : {
        selected: startDate,
        onChange: handleChange,
        startDate: startDate,
        endDate: endDate,
        selectsRange: true,
        renderCustomHeader: undefined,
      };
  return (
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
      <Form.Field>
        <EDTFDatePickerWrapper
          fieldPath={fieldPath}
          handleClear={handleClear}
          placeholder={
            showSingleDatePicker
              ? singleDateInputPlaceholder
              : dateRangeInputPlaceholder
          }
          clearButtonClassName={clearButtonClassName}
          datePickerProps={{
            ...pickerProps,
            dateFormat: "PPP",
            ...datePickerPropsOverrides,
          }}
          helpText={helpText}
        />
      </Form.Field>
      <label className="helptext">{helpText}</label>
    </Form.Field>
  );
};

DateRangePicker.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string,
  helpText: PropTypes.string,
  required: PropTypes.bool,
  clearButtonClassName: PropTypes.string,
  singleDateInputPlaceholder: PropTypes.string,
  dateRangeInputPlaceholder: PropTypes.string,
  datePickerPropsOverrides: PropTypes.object,
  startDateKey: PropTypes.string,
  endDateKey: PropTypes.string,
};

DateRangePicker.defaultProps = {
  icon: "calendar",
  helpText: i18next.t(
    "Choose the time interval in which the event took place."
  ),
  required: false,
  clearButtonClassName: "clear-icon",
  singleDateInputPlaceholder: i18next.t("Choose one date."),
  dateRangeInputPlaceholder: i18next.t("Choose date range (From - To)."),
  startDateKey: "since",
  endDateKey: "until",
};
