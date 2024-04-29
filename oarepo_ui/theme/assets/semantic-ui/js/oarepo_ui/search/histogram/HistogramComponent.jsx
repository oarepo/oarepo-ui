import React from "react";
import { Histogram } from "./histogram";
import { DoubleSlider } from "./DoubleSlider";
import { withState } from "react-searchkit";
import _get from "lodash/get";
import { ShouldRender } from "@js/oarepo_ui";
import { differenceInDays } from "date-fns";

const _getResultBuckets = (resultsAggregations, aggName) => {
  // get buckets of this field
  const thisAggs = _get(resultsAggregations, aggName, {});
  if ("buckets" in thisAggs) {
    if (!Array.isArray(thisAggs["buckets"])) {
      // buckets can be objects or arrays: convert to array if object
      // to keep it consistent
      thisAggs["buckets"] = Object.entries(thisAggs["buckets"]).map(
        ([key, value]) => ({ ...value, key })
      );
    }
    return thisAggs["buckets"];
  }
  return [];
};

const HistogramComponent = ({
  currentResultsState: {
    data: { aggregations, total },
    loading,
  },
  currentQueryState,
  updateQueryState,
  aggName,
}) => {
  // TODO: get min and max year from data
  const MIN_YEAR = new Date(
    "Tue Jan 01 1924 01:00:00 GMT+0100 (Central European Standard Time"
  );
  const MAX_YEAR = new Date(
    "Mon Jan 01 2024 01:00:00 GMT+0100 (Central European Standard Time)"
  );

  const MIN_SLIDER_VALUE = 0;
  const MAX_SLIDER_VALUE = differenceInDays(MAX_YEAR, MIN_YEAR);

  const histogramData = _getResultBuckets(aggregations, aggName).map((d) => {
    return {
      ...d,
      key: new Date(d.key),
    };
  });

  return (
    <ShouldRender condition={!loading && total > 0}>
      <Histogram
        histogramData={histogramData}
        svgHeight={250}
        rectangleClassName={"histogram-rectangle"}
        updateQueryState={updateQueryState}
        currentQueryState={currentQueryState}
        aggName={aggName}
      />
      <DoubleSlider
        aggName={aggName}
        className="horizontal-slider"
        thumbClassName="thumb"
        trackClassName="track"
        ariaLabel={["Lower thumb", "Upper thumb"]}
        ariaValuetext={(state) => `Thumb value ${state.valueNow}`}
        min={MIN_SLIDER_VALUE}
        max={MAX_SLIDER_VALUE}
        minDate={MIN_YEAR}
        maxDate={MAX_YEAR}
      />
    </ShouldRender>
  );
};

export const HistogramWSlider = withState(HistogramComponent);
