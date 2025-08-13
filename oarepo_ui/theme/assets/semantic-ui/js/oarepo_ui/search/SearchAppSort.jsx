import React from "react";
import { Sort } from "react-searchkit";
import PropTypes from "prop-types";

import { i18next } from "@translations/oarepo_ui/i18next";

export const SearchAppSort = ({ options = [] }) => {
  return (
    <Sort sortOrderDisabled values={options} ariaLabel={i18next.t("Sort")} />
  );
};

SearchAppSort.propTypes = {
  // eslint-disable-next-line react/require-default-props
  options: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string,
      sortBy: PropTypes.string,
      sortOrder: PropTypes.string,
    })
  ),
};
