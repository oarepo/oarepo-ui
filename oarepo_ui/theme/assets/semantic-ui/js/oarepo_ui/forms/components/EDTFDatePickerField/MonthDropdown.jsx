import React, { useState } from "react";
import PropTypes from "prop-types";

import { getMonthInLocale } from "./utils";

const MonthDropdown = ({ locale, onChange, month }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const toggleDropdown = () => setDropdownVisible(!dropdownVisible);

  const handleChange = (selectedMonth) => {
    toggleDropdown();
    if (selectedMonth !== month) {
      onChange(selectedMonth);
    }
  };

  const renderSelectOptions = (monthNames) =>
    monthNames.map((m, i) => (
      <option key={m} value={i}>
        {m}
      </option>
    ));

  const monthNames = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) =>
    getMonthInLocale(m, locale)
  );

  return (
    <div
      className={`react-datepicker__month-dropdown-container react-datepicker__month-dropdown-container--select`}
    >
      <select
        value={month}
        className="react-datepicker__month-select"
        onChange={(e) => handleChange(parseInt(e.target.value))}
      >
        {renderSelectOptions(monthNames)}
      </select>
    </div>
  );
};

MonthDropdown.propTypes = {
  locale: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  month: PropTypes.number.isRequired,
};

export default MonthDropdown;
