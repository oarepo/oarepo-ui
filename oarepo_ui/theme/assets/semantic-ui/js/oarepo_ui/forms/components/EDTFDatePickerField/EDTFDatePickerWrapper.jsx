// SPDX-FileCopyrightText: 2024-2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import React, { useRef } from "react";
import DatePicker from "react-datepicker";
import { useField } from "formik";
import { DatePickerHeader } from "./DatePickerHeader";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { edtfDateFormatOptions, getInitialEdtfDateFormat } from "./utils";
import { useLoadLocaleObjects } from "../../../hooks";
import { InputElement } from "./InputElement";

export const EDTFDatePickerWrapper = ({
  fieldPath,
  placeholder = i18next.t("YYYY-MM-DD"),
  clearButtonClassName = "clear-icon",
  dateEdtfFormat,
  setDateEdtfFormat,
  handleClear,
  datePickerProps = {},
  customInputProps = {},
  dateFormat,
  onInputChange,
  allowRange = false,
  isRange = false,
}) => {
  useLoadLocaleObjects();
  const pickerRef = useRef();
  const [{ value }, , { setValue }] = useField(fieldPath);
  const setOpen = (open) => pickerRef.current?.setOpen(open);
  return (
    <DatePicker
      ref={pickerRef}
      locale={i18next.language}
      // the calendar opens from its button or Alt+ArrowDown
      preventOpenOnFocus
      onKeyDown={(e) => {
        if (e.altKey && e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
        }
      }}
      // open at the precision of what's typed
      onCalendarOpen={() =>
        setDateEdtfFormat((format) => getInitialEdtfDateFormat(value, format))
      }
      // back to the text after a pick, like closing with Esc
      onSelect={() => document.getElementById(fieldPath)?.focus()}
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
      customInputRef="inputRef"
      customInput={
        <InputElement
          handleClear={handleClear}
          fieldPath={fieldPath}
          clearButtonClassName={clearButtonClassName}
          autoComplete="off"
          onInputChange={onInputChange ?? setValue}
          onCalendarToggle={() => setOpen(!pickerRef.current?.isCalendarOpen())}
          onCalendarClose={() => setOpen(false)}
          allowRange={allowRange}
          isRange={isRange}
          {...customInputProps}
        />
      }
      placeholderText={placeholder}
      popperModifiers={[
        {
          name: "arrow",
          options: {
            padding: ({ popper, reference, placement }) => ({
              right: Math.min(popper.width, reference.width) - 24,
            }),
          },
        },
      ]}
      {...datePickerProps}
    />
  );
};

EDTFDatePickerWrapper.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  /* eslint-disable react/require-default-props */
  datePickerProps: PropTypes.object,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  clearButtonClassName: PropTypes.string,
  dateEdtfFormat: PropTypes.string.isRequired,
  setDateEdtfFormat: PropTypes.func.isRequired,
  handleClear: PropTypes.func,
  customInputProps: PropTypes.object,
  onInputChange: PropTypes.func,
  allowRange: PropTypes.bool,
  isRange: PropTypes.bool,
  /* eslint-enable react/require-default-props */
  dateFormat: PropTypes.string.isRequired,
};
