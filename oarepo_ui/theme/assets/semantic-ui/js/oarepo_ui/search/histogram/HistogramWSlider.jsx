import React from "react";
import { Histogram } from "./Histogram";
import { DoubleDateSlider } from "./DoubleDateSlider";
import { withState } from "react-searchkit";
import {
  useLoadLocaleObjects,
  _getResultsStats,
  _getResultBuckets,
} from "@js/oarepo_ui";
import PropTypes from "prop-types";
import { Card } from "semantic-ui-react";
import {
  getAddFunc,
  getDiffFunc,
  getFormatString,
  getSubtractFunc,
} from "./utils";
import _get from "lodash/get";

const HistogramComponent = ({
  currentResultsState: {
    data: { aggregations },
    loading,
  },
  svgHeight,
  currentQueryState,
  updateQueryState,
  aggName,
  aggTitle,
  minimumInterval,

  minDateAggName,
  maxDateAggName,
}) => {
  const addFunc = getAddFunc(minimumInterval);
  const diffFunc = getDiffFunc(minimumInterval);
  const subtractFunc = getSubtractFunc(minimumInterval);
  // if we send yyyy/yyyy to the url or yyyy-MM-dd/yyyy-MM-dd
  const facetDateFormat = minimumInterval === "year" ? "yyyy" : "yyyy-MM-dd";

  const formatString = getFormatString(minimumInterval);

  let histogramData = _getResultBuckets(aggregations, aggName).map((d) => {
    return {
      ...d,
      start: new Date(d.start).getTime(),
      end: new Date(d.end).getTime(),
      // as you narrow the range, sometimes buckets would have the same key i.e. same day
      uuid: crypto.randomUUID(),
    };
  });
  useLoadLocaleObjects();
  return (
    histogramData?.length > 0 && (
      <Card className="borderless facet">
        <Card.Content>
          {!loading && (
            <Histogram
              histogramData={histogramData}
              svgHeight={svgHeight}
              rectangleClassName={"histogram-rectangle"}
              updateQueryState={updateQueryState}
              currentQueryState={currentQueryState}
              aggName={aggName}
              formatString={formatString}
              facetDateFormat={facetDateFormat}
              diffFunc={diffFunc}
              addFunc={addFunc}
              subtractFunc={subtractFunc}
            />
          )}
          {/* <DoubleDateSlider
            addFunc={addFunc}
            diffFunc={diffFunc}
            formatString={formatString}
            aggName={aggName}
            thumbClassName="thumb"
            trackClassName="track"
            ariaLabel={["Lower thumb", "Upper thumb"]}
            ariaValuetext={(state) => `Thumb value ${state.valueNow}`}
            min={MIN_SLIDER_VALUE}
            max={MAX_SLIDER_VALUE}
            minDate={MIN_DATE}
            maxDate={MAX_DATE}
            facetDateFormat={facetDateFormat}
            histogramDataLength={histogramData.length}
          /> */}
        </Card.Content>
      </Card>
    )
  );
};

HistogramComponent.propTypes = {
  currentResultsState: PropTypes.object.isRequired,
  currentQueryState: PropTypes.object.isRequired,
  updateQueryState: PropTypes.func.isRequired,
  aggName: PropTypes.string.isRequired,
  aggTitle: PropTypes.string.isRequired,
  minDateAggName: PropTypes.string.isRequired,
  maxDateAggName: PropTypes.string.isRequired,
  minimumInterval: PropTypes.oneOf(["year", "day"]),
  svgHeight: PropTypes.number,
};
// TODO: fix up layout for daily granularity
HistogramComponent.defaultProps = {
  minimumInterval: "year",
  svgHeight: 300,
};
export const HistogramWSlider = withState(HistogramComponent);
