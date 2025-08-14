import React from "react";
import { Histogram } from "./Histogram";
import { withState, ResultsLoader } from "react-searchkit";
import { useLoadLocaleObjects } from "../../hooks";
import { _getResultBuckets } from "../util";
import PropTypes from "prop-types";
import { Card } from "semantic-ui-react";
import {
  getAddFunc,
  getDiffFunc,
  getFormatString,
  getSubtractFunc,
} from "./utils";

const HistogramComponent = ({
  currentResultsState: {
    data: { aggregations },
  },
  svgHeight = 220,
  sliderHeight = 80,
  currentQueryState,
  updateQueryState,
  aggName,
  minimumInterval = "year",
  rectanglePadding = 1,
  svgMargins = [20, 30, 0, 10],
  rectangleClassName = "histogram-rectangle",
  rectangleOverlayClassName = "histogram-rectangle-overlay",
  singleRectangleClassName = "histogram-rectangle-single",
  showLabels = true,
}) => {
  const addFunc = getAddFunc(minimumInterval);
  const diffFunc = getDiffFunc(minimumInterval);
  const subtractFunc = getSubtractFunc(minimumInterval);
  const facetDateFormat = minimumInterval === "year" ? "yyyy" : "yyyy-MM-dd";

  const formatString = getFormatString(minimumInterval);

  let histogramData = _getResultBuckets(aggregations, aggName).map((d) => {
    return {
      ...d,
      start: new Date(d.start).getTime(),
      end: new Date(d.end).getTime(),
      uuid: crypto.randomUUID(),
    };
  });
  useLoadLocaleObjects();
  return (
    histogramData?.length > 0 && (
      <ResultsLoader>
        <Card className="borderless facet ui histogram-container">
          <Card.Content>
            <Histogram
              histogramData={histogramData}
              svgHeight={svgHeight}
              sliderHeight={sliderHeight}
              updateQueryState={updateQueryState}
              currentQueryState={currentQueryState}
              aggName={aggName}
              formatString={formatString}
              facetDateFormat={facetDateFormat}
              minimumInterval={minimumInterval}
              diffFunc={diffFunc}
              addFunc={addFunc}
              subtractFunc={subtractFunc}
              rectanglePadding={rectanglePadding}
              svgMargins={svgMargins}
              rectangleClassName={rectangleClassName}
              rectangleOverlayClassName={rectangleOverlayClassName}
              singleRectangleClassName={singleRectangleClassName}
              showLabels={showLabels}
            />
          </Card.Content>
        </Card>
      </ResultsLoader>
    )
  );
};

HistogramComponent.propTypes = {
  currentResultsState: PropTypes.object.isRequired,
  currentQueryState: PropTypes.object.isRequired,
  updateQueryState: PropTypes.func.isRequired,
  aggName: PropTypes.string.isRequired,

  /* eslint-disable react/require-default-props */
  minimumInterval: PropTypes.oneOf(["year", "day"]),
  svgHeight: PropTypes.number,
  rectanglePadding: PropTypes.number,
  sliderHeight: PropTypes.number,
  rectangleClassName: PropTypes.string,
  rectangleOverlayClassName: PropTypes.string,
  singleRectangleClassName: PropTypes.string,
  svgMargins: PropTypes.array,
  showLabels: PropTypes.bool,
  /* eslint-enable react/require-default-props */
};

export const HistogramWSlider = withState(HistogramComponent);
