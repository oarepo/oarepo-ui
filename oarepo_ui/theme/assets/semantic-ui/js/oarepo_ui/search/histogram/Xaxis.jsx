import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { i18next } from "@translations/oarepo_ui/i18next";
// TODO: importing locales dynamically
import { cs } from "date-fns/locale";

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
          style={{ marginBottom: "40px" }}
        >
          <line y2="6" stroke="currentColor" />
          <text
            key={value}
            style={{
              fontSize: "10px",
              textAnchor: "start", // Anchor set to start (left side)
              dominantBaseline: "hanging", // Align text to top
              transformOrigin: "left top", // Set rotation origin to top-left corner
              transform: `translate(0px, 5px) rotate(45deg)`, // Rotate text by +45 degrees
              height: "20px",
              marginBottom: "20px",
            }}
          >
            {format(value, "PPP", { locale: cs })}
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
