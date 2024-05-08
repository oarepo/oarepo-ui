import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";
import { Xaxis } from "./Xaxis.jsx";
import { Popup } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { formatDate } from "@js/oarepo_ui";
import { differenceInDays, addDays } from "date-fns";

export const Histogram = ({
  histogramData,
  svgWidth,
  svgHeight,
  svgMargins,
  rectangleWidth,
  rectangleSpacing,
  rectangleClassName,
  rectangleOverlayClassName,
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
  let width =
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
    .nice()
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(histogramData, (d) => d?.doc_count)])
    .range([height - marginBottom, marginTop]);

  const maxCountElement = histogramData?.reduce(
    (prev, current) => (prev.doc_count > current.doc_count ? prev : current),
    0
  );
  const bars = histogramData.map((d, i, array) => {
    let intervalSize;
    if (array.length > 1) {
      intervalSize = differenceInDays(array[1].key, array[0].key);
    } else {
      intervalSize = 0;
    }
    const popupContent =
      intervalSize === 0
        ? `${formatDate(array[i].key, "PPP", i18next.language)}: ${i18next.t(
            "totalResults",
            { count: d?.doc_count }
          )}`
        : `${formatDate(array[i].key, "PPP", i18next.language)}/${
            array[i + 1]
              ? formatDate(array[i + 1].key, "PPP", i18next.language)
              : formatDate(
                  addDays(array[i].key, intervalSize),
                  "PPP",
                  i18next.language
                )
          }: ${i18next.t("totalResults", { count: d?.doc_count })}`;

    const rectangleClickValue = `${formatDate(
      d.key,
      "yyyy-MM-dd"
    )}/${formatDate(
      array[i + 1] ? array[i + 1].key : addDays(array[i].key, intervalSize),
      "yyyy-MM-dd"
    )}`;
    return (
      <React.Fragment key={d.uuid}>
        <Popup
          offset={[0, 0]}
          position="right center"
          content={popupContent}
          trigger={
            <rect
              className={rectangleOverlayClassName}
              x={x(d.key) - rectangleWidth / 2}
              width={rectangleWidth}
              y={y(maxCountElement.doc_count)}
              height={y(0) - y(maxCountElement.doc_count)}
              onClick={() => handleRectangleClick(rectangleClickValue)}
            />
          }
        />
        <Popup
          offset={[0, 0]}
          position="right center"
          content={popupContent}
          trigger={
            <rect
              className={rectangleClassName}
              x={x(d.key) - rectangleWidth / 2}
              width={rectangleWidth}
              y={y(d.doc_count)}
              height={y(0) - y(d?.doc_count)}
              onClick={() => {
                handleRectangleClick(rectangleClickValue);
              }}
            />
          }
        />
      </React.Fragment>
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
    histogramData.length > 0 && (
      <div className="ui histogram-container" ref={svgContainerRef}>
        <svg height={height} viewBox={`0 0 ${width} ${height}`}>
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
    )
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
  rectangleOverlayClassName: PropTypes.string,
  updateQueryState: PropTypes.func.isRequired,
  currentQueryState: PropTypes.object.isRequired,
  aggName: PropTypes.string.isRequired,
};

Histogram.defaultProps = {
  rectangleWidth: 12,
  rectangleSpacing: 2,
  rectangleClassName: "histogram-rectangle",
  rectangleOverlayClassName: "histogram-rectangle-overlay",
};
