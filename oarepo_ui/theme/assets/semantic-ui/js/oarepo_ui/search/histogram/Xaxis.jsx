import React, { useMemo } from "react";
import PropTypes from "prop-types";

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
              fontSize: "10px",
              textAnchor: "middle",
              transform: "translateY(20px)",
            }}
          >
            {value}
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
