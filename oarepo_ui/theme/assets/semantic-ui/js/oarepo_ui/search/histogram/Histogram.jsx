import React, { useLayoutEffect, useState, useRef } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";
import { Xaxis } from "./Xaxis.jsx";
import { Popup } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { formatDate } from "@js/oarepo_ui";

export const Histogram = ({
  histogramData,
  svgHeight,
  svgMargins,
  rectangleClassName,
  rectangleOverlayClassName,
  updateQueryState,
  currentQueryState,
  aggName,
  formatString,
  facetDateFormat,
}) => {
  const svgContainerRef = useRef();

  const handleRectangleClick = (value, d) => {
    if (d.doc_count === 0) return;
    if (histogramData.length === 1) return;
    const filters = currentQueryState.filters.filter((f) => f[0] !== aggName);
    updateQueryState({
      ...currentQueryState,
      filters: [...filters, [aggName, value]],
    });
  };

  const [marginTop, marginRight, marginBottom, marginLeft] = svgMargins ?? [
    20, 20, 30, 20,
  ];

  const [width, setWidth] = useState(400);

  const height = svgHeight ?? 550;
  const rectangleWidth = width / (histogramData.length + 5);
  const x = d3
    .scaleTime()
    .domain([
      histogramData[0]?.start,
      histogramData[histogramData.length - 1]?.start,
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
    const popupContent =
      array[i].start.getTime() === array[i].end.getTime()
        ? `${formatDate(
            array[i].start,
            formatString,
            i18next.language
          )}: ${i18next.t("totalResults", { count: d?.doc_count })}`
        : `${formatDate(
            array[i].start,
            formatString,
            i18next.language
          )}/${formatDate(
            array[i]?.end ?? array[i].start,
            formatString,
            i18next.language
          )}: ${i18next.t("totalResults", { count: d?.doc_count })}`;

    const rectangleClickValue = `${formatDate(
      d.start,
      facetDateFormat
    )}/${formatDate(d.end ?? d.start, facetDateFormat)}`;
    console.log(x(d.start) - x(d.end));
    return (
      <React.Fragment key={d.uuid}>
        <Popup
          offset={[0, 0]}
          position="right center"
          content={popupContent}
          trigger={
            <rect
              tabIndex={0}
              className={rectangleOverlayClassName}
              x={x(d.start) - rectangleWidth / 2}
              width={rectangleWidth}
              y={y(maxCountElement.doc_count)}
              height={y(0) - y(maxCountElement.doc_count)}
              onClick={() => handleRectangleClick(rectangleClickValue, d)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRectangleClick(rectangleClickValue, d);
                }
              }}
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
              x={x(d.start) - rectangleWidth / 2}
              width={rectangleWidth}
              y={y(d.doc_count)}
              height={y(0) - y(d?.doc_count)}
              onClick={() => {
                handleRectangleClick(rectangleClickValue, d);
              }}
            />
          }
        />
      </React.Fragment>
    );
  });

  useLayoutEffect(() => {
    setWidth(
      (svgContainerRef.current.clientWidth > 0
        ? svgContainerRef.current.clientWidth
        : width) -
        marginLeft -
        marginRight
    );
  }, [marginLeft, marginRight, width]);

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
            formatString={formatString}
          />
        </svg>
      </div>
    )
  );
};

Histogram.propTypes = {
  histogramData: PropTypes.arrayOf(
    PropTypes.shape({
      start: PropTypes.instanceOf(Date).isRequired,
      end: PropTypes.instanceOf(Date).isRequired,
      doc_count: PropTypes.number.isRequired,
    })
  ).isRequired,
  svgHeight: PropTypes.number,
  svgMargins: PropTypes.arrayOf(PropTypes.number.isRequired),
  rectangleClassName: PropTypes.string,
  rectangleOverlayClassName: PropTypes.string,
  updateQueryState: PropTypes.func.isRequired,
  currentQueryState: PropTypes.object.isRequired,
  aggName: PropTypes.string.isRequired,
  formatString: PropTypes.string,
  facetDateFormat: PropTypes.string,
};

Histogram.defaultProps = {
  rectangleClassName: "histogram-rectangle",
  rectangleOverlayClassName: "histogram-rectangle-overlay",
};
