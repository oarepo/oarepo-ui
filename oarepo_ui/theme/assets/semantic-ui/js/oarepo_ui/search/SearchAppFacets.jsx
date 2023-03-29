import React from "react";
import PropTypes from "prop-types";

import { ContribSearchAppFacets } from "@js/invenio_search_ui/components";

export const SearchAppFacets = ({ props }) => {
  return <ContribSearchAppFacets {...props} toggle />;
};

SearchAppFacets.propTypes = {
  toggle: PropTypes.boolean,
};
