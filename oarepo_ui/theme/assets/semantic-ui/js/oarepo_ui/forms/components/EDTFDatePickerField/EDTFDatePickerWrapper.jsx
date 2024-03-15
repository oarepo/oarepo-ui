import React from "react";
import DatePicker from "react-datepicker";
import { DatePickerHeader } from "./DatePickerHeader";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { edtfDateFormatOptions } from "./utils";
import { useLoadLocaleObjects } from "./hooks";
import { InputElement } from "./InputElement";

export const EDTFDatePickerWrapper = ({
  fieldPath,
  placeholder,
  clearButtonClassName,
  dateEdtfFormat,
  setDateEdtfFormat,
  handleChange,
  handleClear,
  datePickerProps,
  customInputProps,
  dateFormat,
}) => {
  useLoadLocaleObjects();
  return (
    <DatePicker
      locale={i18next.language}
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
      dateFormat={dateFormat}
      clearButtonClassName={clearButtonClassName}
      showPopperArrow={false}
      customInput={
        <InputElement
          handleClear={handleClear}
          fieldPath={fieldPath}
          clearButtonClassName={clearButtonClassName}
          {...customInputProps}
        />
      }
      placeholderText={placeholder}
      {...datePickerProps}
    />
  );
};

EDTFDatePickerWrapper.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  datePickerProps: PropTypes.object,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  clearButtonClassName: PropTypes.string,
  dateEdtfFormat: PropTypes.string,
  setDateEdtfFormat: PropTypes.func,
  handleChange: PropTypes.func,
  handleClear: PropTypes.func,
  customInputProps: PropTypes.object,
  dateFormat: PropTypes.string,
};

EDTFDatePickerWrapper.defaultProps = {
  required: false,
  placeholder: i18next.t("Choose a date."),
  clearButtonClassName: "clear-icon",
};