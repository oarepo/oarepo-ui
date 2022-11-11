import * as React from "react";
import PropTypes from "prop-types";
import { useLayout } from "@js/oarepo_ui";
import { SearchConfigurationContext } from "@js/invenio_search_ui/components";

// TODO: provide some default layout config here as fallback?
const DEFAULT_LAYOUT = {};

export const OARepoRecordResultsListItem = ({ result, index }) => {
  const { layoutOptions, buildUID } = React.useContext(
    SearchConfigurationContext
  );

  console.debug(
    "render OARepoRecordResultsListItem:",
    result,
    index,
    layoutOptions
  );

  return useLayout({
    layout: layoutOptions.ResultsList?.item || DEFAULT_LAYOUT,
    data: result,
    key: index,
  });
};

OARepoRecordResultsListItem.propTypes = {
  result: PropTypes.object.isRequired,
};
