import React from "react";
import PropTypes from "prop-types";

export const Xaxis = ({ height, marginBottom, width }) => {
  return (
    <svg className="x-axis-container">
      <path
        className="x-axis-line"
        d={`M ${0} ${height - marginBottom} H ${width}`}
      />
    </svg>
  );
};

Xaxis.propTypes = {
  height: PropTypes.number.isRequired,
  marginBottom: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
};
