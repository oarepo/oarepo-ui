import React, { useContext } from "react";
import Overridable from "react-overridable";
import { PropTypes } from "prop-types";
import { LayoutSwitcher } from "react-searchkit";
import { ResultCountWithState } from "./ResultCount";
import { SearchConfigurationContext } from "@js/invenio_search_ui/components";
import { SearchAppSort } from "./SearchAppSort";

export const SearchAppResultOptions = ({ sortOptions, layoutOptions }) => {
  const { buildUID } = useContext(SearchConfigurationContext);
  const multipleLayouts =
    Object.values(layoutOptions).filter((i) => i).length > 1;
  return (
    <React.Fragment>
      <ResultCountWithState />
      {sortOptions && (
        <Overridable id={buildUID("SearchApp.sort")} options={sortOptions}>
          <SearchAppSort />
        </Overridable>
      )}
      {multipleLayouts && <LayoutSwitcher />}
    </React.Fragment>
  );
};

SearchAppResultOptions.propTypes = {
  sortOptions: PropTypes.arrayOf(
    PropTypes.shape({
      sortBy: PropTypes.string,
      text: PropTypes.string,
    })
  ),
  paginationOptions: PropTypes.shape({
    defaultValue: PropTypes.number,
    resultsPerPage: PropTypes.array,
  }),
  layoutOptions: PropTypes.object,
};
