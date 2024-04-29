import React, { useState } from "react";
import { Histogram } from "./histogram";
import { arrayData } from "./data";
import { DoubleSlider } from "./DoubleSlider";
import { withState } from "react-searchkit";
import _get from "lodash/get";

const renderThumb = (props, state) => {
  console.log(state);
  return (
    <div {...props}>
      <div></div>
    </div>
  );
};

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
    data: { aggregations },
    loading,
  },
  currentQueryState,
  updateQueryState,
  aggName,
}) => {
  // TODO: get min and max year from data
  const MIN_YEAR = 1924;
  const MAX_YEAR = 2024;
  // const [sliderValue, setSliderValue] = useState([
  //   arrayData[0].year,
  //   arrayData[arrayData.length - 1].year,
  // ]);
  const histogramData = _getResultBuckets(aggregations, aggName).map((d) => {
    return { ...d, key: parseInt(d.key), doc_count: d.doc_count + 200 };
  });
  console.log(histogramData);
  // const handleAfterChange = (value) => {
  //   const newData = histogramData.filter(
  //     (d) => d.year >= value[0] && d.year <= value[1]
  //   );
  //   setData(newData);
  // };

  // const handleChange = (value) => {
  //   setSliderValue(value);
  // };

  // const handleRectangleClick = (value) => {
  //   setSliderValue([value.year, value.year]);
  //   // setData([value]);
  // };

  return (
    !loading && (
      <React.Fragment>
        <Histogram
          histogramData={histogramData}
          svgHeight={250}
          rectangleClassName={"histogram-rectangle"}
          updateQueryState={updateQueryState}
          currentQueryState={currentQueryState}
          aggName={aggName}
        />
        <DoubleSlider
          // sliderValue={sliderValue}
          aggName={aggName}
          className="horizontal-slider"
          thumbClassName="thumb"
          trackClassName="track"
          ariaLabel={["Lower thumb", "Upper thumb"]}
          ariaValuetext={(state) => `Thumb value ${state.valueNow}`}
          min={MIN_YEAR}
          max={MAX_YEAR}
        />
      </React.Fragment>
    )
  );
};

export const HistogramWSlider = withState(HistogramComponent);
