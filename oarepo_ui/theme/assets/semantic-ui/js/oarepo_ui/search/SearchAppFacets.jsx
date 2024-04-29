import React from "react";
import { BucketAggregation } from "react-searchkit";
import { HistogramWSlider } from "./histogram/HistogramComponent";

export const SearchAppFacets = ({ aggs, appName }) => {
  const histogramAgg = aggs.find(
    (agg) => agg.aggName === "date_issued_histogram"
  );
  const otherAggs = aggs.filter(
    (agg) => agg.aggName !== "date_issued_histogram"
  );
  console.log(otherAggs);
  return (
    <div className="facets-container">
      <div className="facet-list">
        {histogramAgg && <HistogramWSlider aggName="date_issued_histogram" />}
        {otherAggs.map((agg) => (
          <BucketAggregation key={agg.aggName} title={agg.title} agg={agg} />
        ))}
      </div>
    </div>
  );
};
