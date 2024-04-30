import React from "react";
import { Histogram } from "./Histogram";
import { DoubleDateSlider } from "./DoubleDateSlider";
import { withState } from "react-searchkit";
import _get from "lodash/get";
import { ShouldRender, useLoadLocaleObjects } from "@js/oarepo_ui";
import { differenceInDays } from "date-fns";
import PropTypes from "prop-types";

// TODO:
// 2. Create its own less component for slider
// 5. figure out memory leak issue two times calling api on mouse up
// 6. Is it possible to somehow implement similar principle as for dynamic list item
// but for buckets
// 8. make it possible to hover over bars with small doc count
// 10. get min and max year from data
// 11. test with date modified facet too
// 12. display formated selected filter instead of edtf format
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
      // as you narrow the range, sometimes buckets would have the same key i.e. same day
      uuid: crypto.randomUUID(),
    };
  });
  useLoadLocaleObjects();
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
      <DoubleDateSlider
        aggName={aggName}
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

HistogramComponent.propTypes = {
  currentResultsState: PropTypes.object.isRequired,
  currentQueryState: PropTypes.object.isRequired,
  updateQueryState: PropTypes.func.isRequired,
  aggName: PropTypes.string.isRequired,
};
export const HistogramWSlider = withState(HistogramComponent);
