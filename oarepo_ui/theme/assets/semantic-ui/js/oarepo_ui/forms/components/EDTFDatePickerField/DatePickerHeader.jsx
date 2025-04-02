import React from "react";
import { Dropdown } from "semantic-ui-react";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import MonthDropdown from "./MonthDropdown";
import YearDropdown from "./YearDropdown";
import {
  getYear,
  getMonth,
} from "date-fns";

export const DatePickerHeader = ({
  dateEdtfFormat,
  monthDate,
  decreaseMonth,
  increaseMonth,
  increaseYear,
  decreaseYear,
  date,
  setDateEdtfFormat,
  edtfDateFormatOptions,
  changeYear,
  changeMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
  ...props
}) => {
  return (
    <div>
      {(dateEdtfFormat === "yyyy-mm" || dateEdtfFormat === "yyyy-mm-dd") && (
        <div>
          <button
            aria-label={i18next.t("Previous Month")}
            className={
              "react-datepicker__navigation react-datepicker__navigation--previous"
            }
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
          >
            <span
              className={
                "react-datepicker__navigation-icon react-datepicker__navigation-icon--previous"
              }
            >
              {"<"}
            </span>
          </button>
          <span className="react-datepicker__current-month">
            {monthDate.toLocaleString(i18next.language, {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            aria-label={i18next.t("Next Month")}
            className={
              "react-datepicker__navigation react-datepicker__navigation--next"
            }
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
          >
            <span
              className={
                "react-datepicker__navigation-icon react-datepicker__navigation-icon--next"
              }
            >
              {">"}
            </span>
          </button>
        </div>
      )}
      {dateEdtfFormat === "yyyy" && (
        <div>
          <button
            aria-label={i18next.t("Previous Month")}
            className={
              "react-datepicker__navigation react-datepicker__navigation--previous"
            }
            onClick={decreaseYear}
            disabled={prevMonthButtonDisabled}
          >
            <span
              className={
                "react-datepicker__navigation-icon react-datepicker__navigation-icon--previous"
              }
            >
              {"<"}
            </span>
          </button>
          <span className="react-datepicker__current-month">
            {date.getFullYear()}
          </span>
          <button
            aria-label={i18next.t("Next Month")}
            className={
              "react-datepicker__navigation react-datepicker__navigation--next"
            }
            onClick={increaseYear}
            disabled={nextMonthButtonDisabled}
          >
            <span
              className={
                "react-datepicker__navigation-icon react-datepicker__navigation-icon--next"
              }
            >
              {">"}
            </span>
          </button>
        </div>
      )}
      <div>
        <span>{i18next.t("Select: ")}</span>
        <Dropdown
          className="datepicker-dropdown"
          options={edtfDateFormatOptions}
          onChange={(e, data) => setDateEdtfFormat(data.value)}
          value={dateEdtfFormat}
        />
      </div>
      {dateEdtfFormat === "yyyy-mm-dd" && (
        <MonthDropdown
          locale={i18next.language}
          onChange={changeMonth}
          month={getMonth(date)}
        />
      )}
      {(dateEdtfFormat === "yyyy-mm" || dateEdtfFormat === "yyyy-mm-dd") && (
        <YearDropdown
          {...props}
          locale={i18next.language}
          onChange={changeYear}
          year={getYear(date)}
          date={date}
        />
      )}
    </div>
  );
};

DatePickerHeader.propTypes = {
  dateEdtfFormat: PropTypes.string.isRequired,
  monthDate: PropTypes.instanceOf(Date),
  decreaseMonth: PropTypes.func.isRequired,
  increaseMonth: PropTypes.func.isRequired,
  increaseYear: PropTypes.func.isRequired,
  decreaseYear: PropTypes.func.isRequired,
  date: PropTypes.instanceOf(Date).isRequired,
  setDateEdtfFormat: PropTypes.func.isRequired,
  edtfDateFormatOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
  changeYear: PropTypes.func.isRequired,
  changeMonth: PropTypes.func.isRequired,
  prevMonthButtonDisabled: PropTypes.bool,
  nextMonthButtonDisabled: PropTypes.bool,
};
