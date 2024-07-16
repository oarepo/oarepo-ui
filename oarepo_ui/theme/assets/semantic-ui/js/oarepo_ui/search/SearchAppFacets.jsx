import React from "react";
import { BucketAggregation } from "react-searchkit";
import PropTypes from "prop-types";

export const SearchAppFacets = ({ aggs, appName }) => {
  return (
    <div className="facets-container">
      <div className="facet-list">
        {aggs.map((agg) => (
          <BucketAggregation key={agg.aggName} title={agg.title} agg={agg} />
        ))}
      </div>
    </div>
  );
};

SearchAppFacets.propTypes = {
  aggs: PropTypes.array.isRequired,
  appName: PropTypes.string.isRequired,
};
