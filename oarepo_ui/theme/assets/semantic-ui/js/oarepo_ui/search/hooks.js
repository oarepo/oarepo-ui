import { useContext } from "react";
import { SearchConfigurationContext } from "@js/invenio_search_ui/components";

export const useActiveSearchFilters = (queryFilters = []) => {
  const { aggs = [] } = useContext(SearchConfigurationContext);
  const aggNames = aggs.map((agg) => agg.aggName);
  return queryFilters.filter((filter) => aggNames.includes(filter[0]));
};
