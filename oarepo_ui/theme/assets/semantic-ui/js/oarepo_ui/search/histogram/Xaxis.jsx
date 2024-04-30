import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { formatDate } from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";

export const Xaxis = ({ xScale, height, marginBottom, width }) => {
  const ticks = useMemo(() => {
    return xScale.ticks(width / 80).map((value) => ({
      value,
      xOffset: xScale(value),
    }));
  }, [width, xScale]);
  return (
    <svg>
      <path
        d={`M ${0} ${height - marginBottom} H ${width}`}
        stroke="currentColor"
      />
      {ticks.map(({ value, xOffset }) => (
        <g
          key={value}
          transform={`translate(${xOffset}, ${height - marginBottom})`}
        >
          <line y2="6" stroke="currentColor" />
          <text
            key={value}
            style={{
              fontSize: "12px",
              textAnchor: "start",
              dominantBaseline: "hanging",
              transformOrigin: "left top",
              transform: `translate(0px, 5px) rotate(45deg)`,
              height: "20px",
              marginBottom: "20px",
            }}
          >
            {formatDate(value, "dd LLLL yyyy", i18next.language)}
          </text>
        </g>
      ))}
    </svg>
  );
};

Xaxis.propTypes = {
  xScale: PropTypes.func.isRequired,
  height: PropTypes.number.isRequired,
  marginBottom: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
};
