import React from "react";
import PropTypes from "prop-types";

import { Label } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";

export const CountElement = ({ totalResults }) => {
  return (
    <Label size="large">
      {i18next.t("totalResults", { count: totalResults, val: totalResults })}
    </Label>
  );
};

CountElement.propTypes = {
  totalResults: PropTypes.number.isRequired,
};
