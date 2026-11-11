// SPDX-FileCopyrightText: 2024-2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import React, { useState } from "react";
import { useField, useFormikContext } from "formik";
import PropTypes from "prop-types";
import { Button, Form } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  allEmptyStrings,
  serializeDate,
  deserializeDate,
  getDateFormatStringFromEdtfFormat,
  getInitialEdtfDateFormat,
} from "./utils";
import { EDTFDatePickerWrapper } from "./EDTFDatePickerWrapper";
import { useFieldData } from "../../hooks";
import { FieldLabel } from "react-invenio-forms";
import { mergeFieldData } from "../../util";

export const EDTFDaterangePicker = ({
  fieldPath,
  label,
  icon = "calendar",
  helpText,
  required,
  dateRangeInputPlaceholder = i18next.t("YYYY-MM-DD/YYYY-MM-DD"),
  singleDateInputPlaceholder = i18next.t("YYYY-MM-DD"),
  datePickerPropsOverrides,
  customInputProps = {},
  width = 16,
}) => {
  const { setFieldValue } = useFormikContext();
  const { getFieldData } = useFieldData();

  const [field] = useField(fieldPath);
  const initialEdtfDateFormat = getInitialEdtfDateFormat(field?.value);
  const [dateEdtfFormat, setDateEdtfFormat] = useState(initialEdtfDateFormat);
  let dates;
  if (field?.value) {
    // a plain date (no "/") is a single date, not a range without an end
    const [start, end = start] = field.value.split("/");
    dates = [start, end].map((date) => deserializeDate(date));
  } else {
    dates = [null, null];
  }

  // like the prototype, an empty field starts as Single: typing a "/" switches to Range
  const [showSingleDatePicker, setShowSingleDatePicker] = useState(
    !field?.value?.includes("/")
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

  // a single date is stored as a plain date, not as a "date/date" interval
  const handleSingleDateChange = (date) => {
    setFieldValue(fieldPath, serializeDate(date, dateEdtfFormat));
  };

  // a typed "/" switches to Range
  const handleInputChange = (value) => {
    if (value.includes("/")) setShowSingleDatePicker(false);
    setFieldValue(fieldPath, value);
  };

  const handleClear = () => {
    dates = [...dates];
    dates = [null, null];
    handleChange(dates);
  };

  // keep the first date as typed, at its own precision
  const handleSingleDatePickerSelection = () => {
    const [start, end] = (field?.value || "").split("/");
    if (end !== undefined) setFieldValue(fieldPath, start || end);
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
        // an unfinished range would be saved as an open interval ("2025/")
        onCalendarClose: () => {
          if (startDate && !endDate) handleSingleDatePickerSelection();
        },
      };

  const fieldData = mergeFieldData(
    getFieldData({ fieldPath, icon, fieldRepresentation: "text" }),
    { label, required, helpText }
  );
  return (
    <Form.Field
      className="ui datepicker field mb-0"
      required={fieldData.required}
      width={width}
    >
      <FieldLabel htmlFor={fieldPath} icon={icon} label={fieldData.label} />
      <Button.Group
        size="mini"
        role="group"
        aria-label={i18next.t("Single date or date range")}
      >
        <Button
          type="button"
          toggle
          active={showSingleDatePicker}
          data-tooltip={i18next.t("Single date")}
          aria-label={i18next.t("Single date")}
          onClick={handleSingleDatePickerSelection}
        >
          {i18next.t("Single")}
        </Button>
        <Button
          type="button"
          toggle
          active={!showSingleDatePicker}
          data-tooltip={i18next.t("Date range")}
          aria-label={i18next.t("Date range")}
          onClick={() => setShowSingleDatePicker(false)}
        >
          {i18next.t("Range")}
        </Button>
      </Button.Group>
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
          onInputChange={handleInputChange}
          allowRange
          isRange={!showSingleDatePicker}
          datePickerProps={{ ...pickerProps, ...datePickerPropsOverrides }}
          customInputProps={{
            helpText: fieldData.helpText,
            ...customInputProps,
          }}
        />
      </Form.Field>
    </Form.Field>
  );
};

EDTFDaterangePicker.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  /* eslint-disable react/require-default-props */
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  icon: PropTypes.string,
  helpText: PropTypes.string,
  required: PropTypes.bool,
  singleDateInputPlaceholder: PropTypes.string,
  dateRangeInputPlaceholder: PropTypes.string,
  datePickerPropsOverrides: PropTypes.object,
  customInputProps: PropTypes.object,
  width: PropTypes.number,
  /* eslint-enable react/require-default-props */
};
