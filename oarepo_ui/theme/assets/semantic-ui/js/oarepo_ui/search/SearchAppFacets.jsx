import React from "react";
import { BucketAggregation } from "react-searchkit";

export const SearchAppFacets = ({ aggs, appName }) => {
  return (
    <div className="facets-container">
      <div className="facets-header">
        <h2>Filters</h2>
        <div className="ui divider"></div>
      </div>
      <div className="vertical scroll facet-list">
        {aggs.map((agg) => (
          <BucketAggregation key={agg.aggName} title={agg.title} agg={agg} />
        ))}
      </div>
    </div>
  );
};
