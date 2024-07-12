import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";
import { Popup, Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { formatDate } from "@js/oarepo_ui";
import { Slider } from "./Slider";
import { getOpacityClass } from "./utils";

export const Histogram = ({
  histogramData,
  svgHeight,
  sliderHeight,
  svgMargins,
  rectangleClassName,
  rectangleOverlayClassName,
  singleRectangleClassName,
  updateQueryState,
  currentQueryState,
  aggName,
  formatString,
  facetDateFormat,
  diffFunc,
  addFunc,
  subtractFunc,
  rectanglePadding,
  minimumInterval,
  showLabels,
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

  const isFiltered = currentQueryState.filters.some((f) => f[0] === aggName);
  const [marginTop, marginRight, marginBottom, marginLeft] = svgMargins ?? [
    20, 10, 0, 10,
  ];

  const [width, setWidth] = useState(400);

  const height = svgHeight;

  const [minDate, maxDate] = [
    histogramData[0]?.start,
    histogramData[histogramData.length - 1]?.end,
  ];

  const x = d3
    .scaleLinear()
    .domain([minDate, maxDate])
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(histogramData, (d) => d?.doc_count)])
    .range([height - marginBottom, marginTop]);

  const maxCountElement = histogramData?.reduce(
    (prev, current) => (prev.doc_count > current.doc_count ? prev : current),
    0
  );

  const [selection, setSelection] = useState([minDate, maxDate]);

  const bars = histogramData.map((d, i, array) => {
    let opacity;

    if (selection[0] > d.end || selection[1] < d.start) {
      opacity = 0;
    } else if (selection[0] <= d.start && selection[1] >= d.end) {
      opacity = 1;
    } else if (selection[0] > d.start && selection[1] > d.end) {
      opacity = 1 - (selection[0] - d.start) / (d.end - d.start);
    } else if (selection[1] < d.end && selection[0] < d.start) {
      opacity = (selection[1] - d.start) / (d.end - d.start);
    } else {
      opacity = (selection[1] - selection[0]) / (d.end - d.start);
    }
    // if the interval is 1, show just the one date, if it is greater show from to
    const popupContent =
      array[i].start === subtractFunc(array[i].end, 1).getTime()
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
    const interval = array[i]?.interval.replace(/\D/g, "");
    const rectangleClickValue = `${formatDate(
      d.start,
      facetDateFormat
    )}/${formatDate(subtractFunc(d.end, 1), facetDateFormat)}`;
    return histogramData.length > 1 ? (
      <React.Fragment key={d.uuid}>
        <Popup
          offset={[0, 0]}
          position="right center"
          content={popupContent}
          trigger={
            <rect
              tabIndex={0}
              type="button"
              className={rectangleOverlayClassName}
              x={x(d.start)}
              aria-label={`${i18next.t("Filter data by date")} ${popupContent}`}
              // when I have a smaller rectangle (due to not full interval, I leave overlay so it is easier to click)
              width={
                x(addFunc(d.start, interval).getTime()) -
                x(d.start) -
                rectanglePadding
              }
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
              type="button"
              className={`${rectangleClassName}  ${getOpacityClass(opacity)}`}
              x={x(d.start)}
              width={x(d.end) - x(d.start) - rectanglePadding}
              y={y(d.doc_count)}
              height={y(0) - y(d?.doc_count)}
              onClick={() => {
                handleRectangleClick(rectangleClickValue, d);
              }}
            />
          }
        />
      </React.Fragment>
    ) : (
      <React.Fragment>
        <rect
          key={d.uuid}
          className={singleRectangleClassName}
          x={(x(d.end) - x(d.start)) / 4}
          width={(x(d.end) - x(d.start)) / 2}
          y={y(d.doc_count * 0.8)}
          height={y(0) - y(d?.doc_count * 0.8)}
        />
        <text
          className="single-rectangle-text"
          x={(x(d.end) - x(d.start)) / 2}
          y={y(d.doc_count * 0.9)}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {popupContent}
        </text>
      </React.Fragment>
    );
  });

  useEffect(() => {
    const handleResize = () => {
      setWidth(
        (svgContainerRef.current?.clientWidth > 0
          ? svgContainerRef.current?.clientWidth
          : width) -
          marginLeft -
          marginRight
      );
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [marginLeft, marginRight]);

  const handleReset = () => {
    updateQueryState({
      ...currentQueryState,
      filters: currentQueryState.filters.filter((f) => f[0] !== aggName),
    });
  };

  const handleDragEnd = () => {
    // if someone dragged, but returned to initial position, do not do anything
    if (selection[0] === minDate && selection[1] === maxDate) {
      return;
    }
    // edge case when someone drags left thumb all the way to the end
    if (selection[0] === selection[1] && selection[0] === maxDate) {
      updateQueryState({
        ...currentQueryState,
        filters: [
          ...currentQueryState.filters.filter((f) => f[0] !== aggName),
          [
            aggName,
            `${formatDate(
              subtractFunc(selection[0], 1),
              facetDateFormat
            )}/${formatDate(subtractFunc(selection[1], 1), facetDateFormat)}`,
          ],
        ],
      });
    }
    // when someone drags all the way to the start
    else if (selection[0] === selection[1]) {
      updateQueryState({
        ...currentQueryState,
        filters: [
          ...currentQueryState.filters.filter((f) => f[0] !== aggName),
          [
            aggName,
            `${formatDate(selection[0], facetDateFormat)}/${formatDate(
              selection[1],
              facetDateFormat
            )}`,
          ],
        ],
      });
    } else {
      updateQueryState({
        ...currentQueryState,
        filters: [
          ...currentQueryState.filters.filter((f) => f[0] !== aggName),
          [
            aggName,
            `${formatDate(selection[0], facetDateFormat)}/${formatDate(
              subtractFunc(selection[1], 1),
              facetDateFormat
            )}`,
          ],
        ],
      });
    }
  };
  return (
    histogramData.length > 0 && (
      <div className="histogram-svg-container" ref={svgContainerRef}>
        {isFiltered && (
          <Button
            type="button"
            onClick={handleReset}
            className="transparent right-floated mt-5"
          >
            {i18next.t("Reset")}
          </Button>
        )}
        <svg height={height} viewBox={`0 0 ${width} ${height}`}>
          {bars}
        </svg>
        {histogramData.length > 1 && (
          <Slider
            onChange={(selection) => setSelection(selection)}
            width={width}
            selection={selection}
            scale={x}
            min={minDate}
            max={maxDate}
            formatLabelFunction={formatDate}
            updateQueryState={updateQueryState}
            handleDragEnd={handleDragEnd}
            marginLeft={marginLeft}
            marginRight={marginRight}
            height={sliderHeight}
            formatString={formatString}
            diffFunc={diffFunc}
            aggName={aggName}
            minimumInterval={minimumInterval}
            showLabels={showLabels}
          />
        )}
      </div>
    )
  );
};

Histogram.propTypes = {
  histogramData: PropTypes.arrayOf(
    PropTypes.shape({
      start: PropTypes.number.isRequired,
      end: PropTypes.number.isRequired,
      doc_count: PropTypes.number.isRequired,
    })
  ).isRequired,
  svgHeight: PropTypes.number,
  sliderHeight: PropTypes.number,
  svgMargins: PropTypes.arrayOf(PropTypes.number.isRequired),
  rectangleClassName: PropTypes.string,
  rectangleOverlayClassName: PropTypes.string,
  singleRectangleClassName: PropTypes.string,
  updateQueryState: PropTypes.func.isRequired,
  currentQueryState: PropTypes.object.isRequired,
  aggName: PropTypes.string.isRequired,
  formatString: PropTypes.string,
  facetDateFormat: PropTypes.string,
  diffFunc: PropTypes.func.isRequired,
  addFunc: PropTypes.func.isRequired,
  subtractFunc: PropTypes.func.isRequired,
  rectanglePadding: PropTypes.number.isRequired,
  minimumInterval: PropTypes.oneOf(["year", "day"]).isRequired,
  showLabels: PropTypes.bool.isRequired,
};
