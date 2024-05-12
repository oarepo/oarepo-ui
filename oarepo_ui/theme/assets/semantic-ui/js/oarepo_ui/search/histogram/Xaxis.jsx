import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { formatDate } from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";

export const Xaxis = ({ xScale, height, marginBottom, width }) => {
  let ticks = useMemo(() => {
    return xScale.ticks(width / 80).map((value) => ({
      value,
      xOffset: xScale(value),
    }));
  }, [width, xScale]);

  return (
    <svg className="x-axis-container">
      <path
        className="x-axis-line"
        d={`M ${0} ${height - marginBottom} H ${width}`}
      />
      {/* {ticks.map(({ value, xOffset }) => {
        return (
          <g
            key={value}
            transform={`translate(${xOffset}, ${height - marginBottom})`}
          >
            <line y2="6" className="x-axis-tick" />
            <text className="x-axis-label" key={value}>
              {formatDate(value, "dd LLLL yyyy", i18next.language)}
            </text>
          </g>
        );
      })} */}
    </svg>
  );
};

Xaxis.propTypes = {
  xScale: PropTypes.func.isRequired,
  height: PropTypes.number.isRequired,
  marginBottom: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
};
