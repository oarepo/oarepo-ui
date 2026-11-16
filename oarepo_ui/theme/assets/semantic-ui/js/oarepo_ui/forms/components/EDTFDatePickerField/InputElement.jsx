// SPDX-FileCopyrightText: 2024-2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from "react";
import { Button } from "semantic-ui-react";
import PropTypes from "prop-types";
import { TextField } from "react-invenio-forms";
import { useField } from "formik";
import { i18next } from "@translations/oarepo_ui/i18next";
import { getEdtfDateError, maskEdtfInput } from "./utils";

export const InputElement = ({
  fieldPath,
  label,
  placeholder,
  className,
  clearButtonClassName = "clear-icon",
  handleClear,
  onKeyDown,
  autoComplete,
  helpText = "",
  onInputChange,
  onCalendarToggle,
  onCalendarClose,
  calendarOpen = false,
  inputElRef,
  allowRange = false,
  isRange = false,
}) => {
  const [field] = useField(fieldPath);
  const value = field.value || "";
  const error = getEdtfDateError(value, isRange, allowRange);
  // check on blur, then keep the message live until the value is fine
  const [showError, setShowError] = useState(false);
  useEffect(() => {
    if (!error) setShowError(false);
  }, [error]);

  const handleChange = (e) => {
    const input = e.target;
    const { value: masked, caret } = maskEdtfInput(
      input.value,
      input.selectionStart ?? input.value.length,
      e.nativeEvent.inputType === "insertText"
    );
    // set the text and caret ourselves: React then finds the input up to date and
    // doesn't rewrite it, which would throw the caret to the end
    input.value = masked;
    input.setSelectionRange(caret, caret);
    onInputChange(masked);
  };

  // keep the focus (and the caret) in the text when clicking the buttons
  const keepFocus = (e) => e.preventDefault();

  return (
    <TextField
      fieldPath={fieldPath}
      value={value}
      onChange={handleChange}
      onBlur={(e) => {
        field.onBlur(e);
        // not while picking: half a range is expected between the two clicks
        if (e.relatedTarget?.closest(".react-datepicker")) return;
        const reveal = () => setShowError(!!error);
        // a message appearing under a pressed button (Save draft) would move it
        // from under the pointer and the click would miss: wait for the release
        if (document.querySelector(":active"))
          document.addEventListener("pointerup", reveal, { once: true });
        else reveal();
      }}
      onKeyDown={(e) => {
        // react-datepicker would pick the calendar's highlighted day over the typed text
        if (e.key === "Enter") {
          // nor should Enter submit the form
          e.preventDefault();
          onCalendarClose();
        } else onKeyDown(e);
      }}
      input={{ ref: inputElRef }}
      label={label}
      placeholder={placeholder}
      className={className}
      id={fieldPath}
      autoComplete={autoComplete}
      helpText={helpText}
      error={(showError && error) || undefined}
      icon={
        <span className="datepicker-input-buttons">
          {value && (
            <Button
              type="button"
              icon="close"
              className={clearButtonClassName}
              aria-label={i18next.t("Clear")}
              onMouseDown={keepFocus}
              onClick={(e) => {
                handleClear(e);
                // the button is gone now, don't lose a keyboard user's focus with it
                inputElRef?.current?.focus();
              }}
            />
          )}
          <Button
            type="button"
            icon="calendar alternate outline"
            // a click outside the open calendar would close it before this toggles it
            className="react-datepicker-ignore-onclickoutside"
            aria-label={i18next.t("Choose from calendar")}
            aria-expanded={calendarOpen}
            onMouseDown={keepFocus}
            onClick={onCalendarToggle}
          />
        </span>
      }
    />
  );
};

/* eslint-disable react/require-default-props */
InputElement.propTypes = {
  clearButtonClassName: PropTypes.string,
  handleClear: PropTypes.func,
  fieldPath: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  onKeyDown: PropTypes.func,
  autoComplete: PropTypes.string,
  helpText: PropTypes.string,
  onInputChange: PropTypes.func,
  onCalendarToggle: PropTypes.func,
  onCalendarClose: PropTypes.func,
  calendarOpen: PropTypes.bool,
  inputElRef: PropTypes.object,
  allowRange: PropTypes.bool,
  isRange: PropTypes.bool,
};
/* eslint-enable react/require-default-props */
