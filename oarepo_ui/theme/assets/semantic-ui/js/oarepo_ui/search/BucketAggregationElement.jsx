import React, { useContext } from "react";
import Overridable from "react-overridable";
import { AppContext } from "react-searchkit";
import { ContribBucketAggregationElement } from "@js/invenio_search_ui/components";
import PropTypes from "prop-types";

export const BucketAggregationElement = (props) => {
  const { buildUID } = useContext(AppContext);
  return (
    // Makes it possible to override UI components for certain buckets
    // by providing them in componentOverrides in the search app initialization
    // it is based on aggName
    <Overridable
      id={buildUID(`BucketAggregation.element.${props.agg.aggName}`)}
      aggName={props.agg.aggName}
      aggTitle={props.agg.title}
    >
      <ContribBucketAggregationElement {...props} />
    </Overridable>
  );
};

BucketAggregationElement.propTypes = {
  agg: PropTypes.shape({
    aggName: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    field: PropTypes.string.isRequired,
  }).isRequired,
};
