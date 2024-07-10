import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";
import { formatDate } from "@js/oarepo_ui";
import { i18next } from "@translations/oarepo_ui/i18next";
import { set } from "date-fns";
import { isBefore } from "date-fns";

export const Xaxis = ({
  xScale,
  height,
  marginBottom,
  width,
  formatString,
  histogramData,
  rectangleWidth,
  handleDragEnd,
  handleDragStart,
  setDragStart,
  setDragEnd,
  dragStart,
  dragEnd,
  currentQueryState,
}) => {
  const xAxisSvgRef = useRef();

  const dragStartCircleRef = useRef();
  const dragEndCircleRef = useRef();

  useMemo(() => {
    if (dragStartCircleRef.current) {
      d3.select(dragStartCircleRef.current).call(handleDragStart());
    }
    if (dragEndCircleRef.current) {
      d3.select(dragEndCircleRef.current).call(handleDragEnd());
    }
  }, [handleDragStart, handleDragEnd]);

  return (
    <svg
      className="x-axis-container"
      ref={xAxisSvgRef}
      width={width}
      height={height}
    >
      <path
        className="x-axis-line"
        d={`M ${0} ${height - marginBottom} H ${width}`}
      />

      <g className="drag-start-group" ref={dragStartCircleRef}>
        <circle
          className="drag-start"
          cx={xScale(dragStart)}
          cy={height - marginBottom}
          r={5}
          fill="red"
        />
        {/* Bubble for Drag Start */}
        <rect
          x={xScale(dragStart) - 20}
          y={height - marginBottom + 10}
          width={40}
          height={20}
          fill="lightgray"
          stroke="black"
          rx={5}
          ry={5}
        />
        <text
          x={xScale(dragStart)}
          y={height - marginBottom + 25}
          textAnchor="middle"
          fontSize="12px"
          fill="black"
        >
          {dragStart.getFullYear()}
        </text>
        <path
          d={`
        M ${xScale(dragStart)},${height - marginBottom + 10}
        L ${xScale(dragStart) - 5},${height - marginBottom + 5}
        L ${xScale(dragStart) + 5},${height - marginBottom + 5}
        Z
      `}
          fill="lightgray"
          stroke="black"
        />
      </g>

      {/* Drag End Group */}
      <g className="drag-end-group" ref={dragEndCircleRef}>
        <circle
          className="drag-end"
          cx={xScale(dragEnd)}
          cy={height - marginBottom}
          r={5}
          fill="red"
        />
        {/* Bubble for Drag End */}
        <rect
          x={xScale(dragEnd) - 20}
          y={height - marginBottom + 10}
          width={40}
          height={20}
          fill="lightgray"
          stroke="black"
          rx={5}
          ry={5}
        />
        <text
          x={xScale(dragEnd)}
          y={height - marginBottom + 25}
          textAnchor="middle"
          fontSize="12px"
          fill="black"
        >
          {dragEnd.getFullYear()}
        </text>
        <path
          d={`
        M ${xScale(dragEnd)},${height - marginBottom + 10}
        L ${xScale(dragEnd) - 5},${height - marginBottom + 5}
        L ${xScale(dragEnd) + 5},${height - marginBottom + 5}
        Z
      `}
          fill="lightgray"
          stroke="black"
        />
      </g>
    </svg>
  );
};

Xaxis.propTypes = {
  xScale: PropTypes.func.isRequired,
  height: PropTypes.number.isRequired,
  marginBottom: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  formatString: PropTypes.string.isRequired,
};
