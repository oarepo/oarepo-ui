import React from "react";
import { Dropdown } from "semantic-ui-react";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";

export const DatePickerHeader = ({
  dateFormat,
  monthDate,
  decreaseMonth,
  increaseMonth,
  increaseYear,
  decreaseYear,
  date,
  setDateFormat,
  edtfDateFormatOptions,
}) => {
  return (
    <div>
      {(dateFormat === "yyyy-MM" || dateFormat === "yyyy-MM-dd") && (
        <div>
          <button
            aria-label="Previous Month"
            className={
              "react-datepicker__navigation react-datepicker__navigation--previous"
            }
            onClick={decreaseMonth}
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
            aria-label="Next Month"
            className={
              "react-datepicker__navigation react-datepicker__navigation--next"
            }
            onClick={increaseMonth}
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
      {dateFormat === "yyyy" && (
        <div>
          <button
            aria-label="Previous Month"
            className={
              "react-datepicker__navigation react-datepicker__navigation--previous"
            }
            onClick={increaseYear}
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
            aria-label="Next Month"
            className={
              "react-datepicker__navigation react-datepicker__navigation--next"
            }
            onClick={decreaseYear}
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
        {/*TODO: semantic UI dropdown items weird styling - maybe make regular dropdown component from scratch */}
        <Dropdown
          options={edtfDateFormatOptions}
          onChange={(e, data) => setDateFormat(data.value)}
          value={dateFormat}
        />
      </div>
    </div>
  );
};

DatePickerHeader.propTypes = {
  dateFormat: PropTypes.string.isRequired,
  monthDate: PropTypes.instanceOf(Date),
  decreaseMonth: PropTypes.func.isRequired,
  increaseMonth: PropTypes.func.isRequired,
  increaseYear: PropTypes.func.isRequired,
  decreaseYear: PropTypes.func.isRequired,
  date: PropTypes.instanceOf(Date).isRequired,
  setDateFormat: PropTypes.func.isRequired,
  edtfDateFormatOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
};
