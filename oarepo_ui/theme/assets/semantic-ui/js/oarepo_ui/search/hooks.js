import { useContext } from "react";
import { SearchConfigurationContext } from "@js/invenio_search_ui/components";

export const useActiveSearchFilters = (queryFilters = []) => {
  const { ignoredSearchFilters = [], additionalFilterLabels = {} } = useContext(
    SearchConfigurationContext
  );
  // filters derived from the query string that are not in the ignoredSearchFilters
  const activeSearchFilters = queryFilters.filter(
    (filter) => !ignoredSearchFilters.includes(filter[0])
  );
  return {
    activeSearchFilters,
    activeFiltersCount: activeSearchFilters.length,
    ignoredSearchFilters,
    additionalFilterLabels,
  };
};
