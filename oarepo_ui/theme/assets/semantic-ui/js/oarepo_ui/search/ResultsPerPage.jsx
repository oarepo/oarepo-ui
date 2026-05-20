import React from "react";
import { Dropdown } from "semantic-ui-react";
import PropTypes from "prop-types";

export const ResultsPerPage = ({
  currentSize,
  options,
  onValueChange,
  ariaLabel,
  selectOnNavigation,
}) => {
  console.log("dwadawda");
  const _options = options.map((element, index) => {
    return { key: index, text: element.text, value: element.value };
  });
  return (
    <Dropdown
      className="results-per-page-selector"
      selection
      compact
      options={_options}
      value={currentSize}
      onChange={(e, { value }) => onValueChange(value)}
      aria-label={ariaLabel}
      selectOnNavigation={selectOnNavigation}
    />
  );
};

ResultsPerPage.propTypes = {
  currentSize: PropTypes.number.isRequired,
  options: PropTypes.array.isRequired,
  onValueChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string,
  selectOnNavigation: PropTypes.bool,
};
