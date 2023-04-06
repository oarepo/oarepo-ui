import React from "react";

import { ContribBucketAggregationValuesElement } from "@js/invenio_search_ui/components";

export const BucketAggregationValuesElement = ({ bucket, ...rest }) => {
  const { key, ...bucketData } = bucket;
  return (
    <ContribBucketAggregationValuesElement
      bucket={{ key: key.toString(), ...bucketData }}
      {...rest}
    />
  );
};
