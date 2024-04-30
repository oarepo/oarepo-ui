import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";
import { Xaxis } from "./Xaxis.jsx";
import { Popup } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { formatDate } from "@js/oarepo_ui";

export const Histogram = ({
  histogramData,
  svgWidth,
  svgHeight,
  svgMargins,
  rectangleWidth,
  rectangleSpacing,
  rectangleClassName,
  updateQueryState,
  currentQueryState,
  aggName,
}) => {
  const svgContainerRef = useRef();

  const handleRectangleClick = (value) => {
    if (value.split("/")[0] === value.split("/")[1]) return;
    const filters = currentQueryState.filters.filter((f) => f[0] !== aggName);
    updateQueryState({
      ...currentQueryState,
      filters: [...filters, [aggName, value]],
    });
  };

  const [marginTop, marginRight, marginBottom, marginLeft] = svgMargins ?? [
    20, 20, 70, 40,
  ];
  const width =
    svgWidth ??
    histogramData.length * (rectangleWidth + rectangleSpacing) +
      marginLeft +
      marginRight +
      50;
  const height = svgHeight ?? 550;

  const x = d3
    .scaleTime()
    .domain([
      histogramData[0]?.key,
      histogramData[histogramData.length - 1]?.key,
    ])
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(histogramData, (d) => d?.doc_count)])
    .range([height - marginBottom, marginTop]);

  const maxCountElement = histogramData.reduce((prev, current) =>
    prev.doc_count > current.doc_count ? prev : current
  );
  console.log(x(maxCountElement.key));
  console.log(maxCountElement);

  const bars = histogramData.map((d, i, array) => {
    let intervalSize;
    if (array.length > 1) {
      intervalSize = array[1].key - array[0].key;
    } else {
      intervalSize = 0;
    }
    // TODO: figure out why the last bar is showing end date of + 1 day
    return (
      <Popup
        offset={[0, 10]}
        position="top center"
        key={d.uuid}
        content={
          intervalSize === 0
            ? `${formatDate(array[i].key, "PPP", i18next.language)}: ${
                d?.doc_count
              }`
            : `${formatDate(array[i].key, "PPP", i18next.language)}-${
                array[i + 1]
                  ? formatDate(array[i + 1].key, "PPP", i18next.language)
                  : formatDate(
                      array[i].key.getTime() +
                        intervalSize -
                        24 * 60 * 60 * 1000,
                      "PPP",
                      i18next.language
                    )
              }: ${d?.doc_count}`
        }
        trigger={
          <rect
            className={
              d.uuid === maxCountElement.uuid
                ? `${rectangleClassName} max-rect`
                : rectangleClassName
            }
            x={x(d.key) - rectangleWidth / 2}
            width={rectangleWidth}
            y={y(d.doc_count)}
            height={y(0) - y(d?.doc_count)}
            fill="steelblue"
            onClick={() =>
              handleRectangleClick(
                `${formatDate(d.key, "yyyy-MM-dd")}/${formatDate(
                  array[i + 1]
                    ? array[i + 1].key
                    : array[i].key.getTime() + intervalSize,
                  "yyyy-MM-dd"
                )}`
              )
            }
          />
        }
      />
    );
  });

  // to scroll into the area where the bar with highest count is
  useEffect(() => {
    if (svgContainerRef.current) {
      svgContainerRef.current.scrollLeft =
        x(maxCountElement.key) - rectangleWidth;
    }
  }, [maxCountElement.key, x, rectangleWidth]);

  return (
    <div
      className="svg-container"
      style={{ overflow: "auto", position: "relative" }}
      ref={svgContainerRef}
    >
      <svg
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ height: "auto" }}
      >
        {bars}
        <Xaxis
          xScale={x}
          height={height}
          marginBottom={marginBottom}
          width={width}
          marginLeft={marginLeft}
          histogramData={histogramData}
        />
      </svg>
    </div>
  );
};

Histogram.propTypes = {
  histogramData: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.instanceOf(Date).isRequired,
      doc_count: PropTypes.number.isRequired,
    })
  ).isRequired,
  svgWidth: PropTypes.number,
  svgHeight: PropTypes.number,
  svgMargins: PropTypes.arrayOf(PropTypes.number.isRequired),
  rectangleWidth: PropTypes.number,
  rectangleSpacing: PropTypes.number,
  rectangleClassName: PropTypes.string,
  updateQueryState: PropTypes.func.isRequired,
};

Histogram.defaultProps = {
  rectangleWidth: 12,
  rectangleSpacing: 2,
  rectangleClassName: "histogram-rectangle",
};
