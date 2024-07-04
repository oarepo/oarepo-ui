import React, { useState } from "react";
import { useField, useFormikContext } from "formik";
import PropTypes from "prop-types";
import { FieldLabel, GroupField } from "react-invenio-forms";
import { Form, Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  serializeDate,
  deserializeDate,
  getDateFormatStringFromEdtfFormat,
  getInitialEdtfDateFormat,
  allEmptyStrings,
} from "@js/oarepo_ui/forms/components/EDTFDatePickerField/utils";
import { EDTFDatePickerWrapper } from "@js/oarepo_ui/forms";
import { formatDate } from "@js/oarepo_ui";
import { InputElement } from "@js/oarepo_ui/forms/components/EDTFDatePickerField/InputElement";

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
  updateQueryState,
  currentQueryState,
  aggName,
  ...datePickerProps
}) => {
  // TODO: The datepickers shall recieve needed locales from form config (set in Invenio.cfg)
  const { setFieldValue } = useFormikContext();
  const [field] = useField(fieldPath);
  console.log(field?.value);
  const initialEdtfDateFormat = getInitialEdtfDateFormat(field?.value);
  const [dateEdtfFormat, setDateEdtfFormat] = useState(initialEdtfDateFormat);
  let dates;
  if (field?.value) {
    dates = field.value.split("/").map((date) => deserializeDate(date));
  } else {
    dates = [null, null];
  }
  console.log(dates);
  const dateFormat = getDateFormatStringFromEdtfFormat(dateEdtfFormat);
  console.log(dateFormat);

  const startDate = dates[0];
  const endDate = dates[1];

  const handleStartChange = (date) => {
    const serializedDates = [date, dates[1]].map((date) =>
      serializeDate(date, dateEdtfFormat)
    );
    if (allEmptyStrings(serializedDates)) {
      setFieldValue(fieldPath, "");
    } else {
      setFieldValue(fieldPath, serializedDates.join("/"));
    }
  };
  const handleEndChange = (date) => {
    const serializedDates = [dates[0], date].map((date) =>
      serializeDate(date, dateEdtfFormat)
    );
    if (allEmptyStrings(serializedDates)) {
      setFieldValue(fieldPath, "");
    } else {
      setFieldValue(fieldPath, serializedDates.join("/"));
    }
  };
  const startDatePickerProps = {
    selected: startDate,
    onChange: handleStartChange,
  };
  const endDatePickerProps = {
    selected: endDate,
    onChange: handleEndChange,
  };

  const handleFilterSelection = () => {
    const filters = currentQueryState.filters.filter((f) => f[0] !== aggName);
    updateQueryState({
      ...currentQueryState,
      filters: [...filters, [aggName, field.value]],
    });
  };
  return (
    <React.Fragment>
      <Form.Field className="ui datepicker field mb-0" required={required}>
        <FieldLabel htmlFor={fieldPath} icon={icon} label={label} />

        <GroupField>
          <EDTFDatePickerWrapper
            fieldPath={fieldPath}
            locale={i18next.language}
            selected={startDate}
            // onChange={(date) => {
            //   dates[0] = date;
            //   handleChange(dates);
            // }}
            selectsStart
            showYearPicker={dateEdtfFormat === "yyyy"}
            showMonthYearPicker={dateEdtfFormat === "yyyy-mm"}
            clearButtonClassName={clearButtonClassName}
            placeholderText={startDateInputPlaceholder}
            setDateEdtfFormat={setDateEdtfFormat}
            dateFormat={dateFormat}
            dateEdtfFormat={dateEdtfFormat}
            datePickerProps={startDatePickerProps}
          />
          <EDTFDatePickerWrapper
            fieldPath={fieldPath}
            locale={i18next.language}
            selected={endDate}
            // onChange={(date) => {
            //   dates[1] = date;
            //   handleChange(dates);
            // }}
            selectsEnd
            minDate={startDate}
            showYearPicker={dateEdtfFormat === "yyyy"}
            showMonthYearPicker={dateEdtfFormat === "yyyy-mm"}
            clearButtonClassName={clearButtonClassName}
            placeholderText={endDateInputPlaceholder}
            setDateEdtfFormat={setDateEdtfFormat}
            dateFormat={dateFormat}
            dateEdtfFormat={dateEdtfFormat}
            datePickerProps={endDatePickerProps}
            {...datePickerProps}
          />
        </GroupField>
      </Form.Field>
      <label className="helptext">{helpText}</label>
      <Button onClick={handleFilterSelection}>Apply filter</Button>
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
