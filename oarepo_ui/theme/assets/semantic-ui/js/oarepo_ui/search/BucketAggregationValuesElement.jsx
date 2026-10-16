// SPDX-FileCopyrightText: 2026 CESNET z.s.p.o.
// SPDX-License-Identifier: MIT

import React from "react";
import PropTypes from "prop-types";

import { ContribBucketAggregationValuesElement } from "@js/invenio_search_ui/components";

export const BucketAggregationValuesElement = ({ bucket, ...rest }) => {
  return (
    <ContribBucketAggregationValuesElement
      bucket={{ ...bucket, key: bucket.key.toString() }}
      {...rest}
    />
  );
};

BucketAggregationValuesElement.propTypes = {
  bucket: PropTypes.shape({
    key: PropTypes.string.isRequired,
  }).isRequired,
};
