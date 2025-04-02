import React, { useState } from "react";
import PropTypes from "prop-types";

import { getYear } from "date-fns";

const YearDropdown = ({
  adjustDateOnChange,
  onChange,
  date,
  onSelect,
  setOpen,
  year,
  minDate,
  maxDate,
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const renderSelectOptions = () => {
    const minYear = minDate ? getYear(minDate) : 1900;
    const maxYear = maxDate ? getYear(maxDate) : 2100;

    const options = [];
    for (let i = minYear; i <= maxYear; i++) {
      options.push(
        <option key={i} value={i}>
          {i}
        </option>
      );
    }
    return options;
  };

  const onSelectChange = (event) => {
    handleChange(parseInt(event.target.value));
  };

  const handleChange = (selectedYear) => {
    toggleDropdown();
    if (selectedYear === year) return;
    onChange(selectedYear);
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
    if (adjustDateOnChange) {
      handleYearChange(date);
    }
  };

  const handleYearChange = (date) => {
    onSelect?.(date);
    setOpen?.(true);
  };

  return (
    <div
      className={`react-datepicker__year-dropdown-container react-datepicker__year-dropdown-container--select`}
    >
      <select
        value={year}
        className="react-datepicker__year-select"
        onChange={onSelectChange}
      >
        {renderSelectOptions()}
      </select>
    </div>
  );
};

YearDropdown.propTypes = {
  adjustDateOnChange: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  date: PropTypes.instanceOf(Date).isRequired,
  onSelect: PropTypes.func,
  setOpen: PropTypes.func,
  year: PropTypes.number.isRequired,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
};

export default YearDropdown;
