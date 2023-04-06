import React from "react";
import { BucketAggregation } from "react-searchkit";

export const SearchAppFacets = ({ aggs, appName }) => {
  return (
    <>
      {aggs.map((agg) => (
        <BucketAggregation key={agg.aggName} title={agg.title} agg={agg} />
      ))}
    </>
  );
};
