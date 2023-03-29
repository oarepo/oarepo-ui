import React from "react";
import PropTypes from "prop-types";

import { Label } from "semantic-ui-react";

export const CountElement = ({ totalResults }) => {
  return <Label>{totalResults.toLocaleString("en-US")}</Label>;
};

CountElement.propTypes = {
  totalResults: PropTypes.number.isRequired,
};
