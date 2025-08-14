import React from "react";
import _get from "lodash/get";
import _camelCase from "lodash/camelCase";
import ReactDOM from "react-dom";
import { parametrize } from "react-overridable";
import { SearchApp } from "@js/invenio_search_ui/components";
import { overridableComponentIds as componentIds } from "./constants";
import { ListItemContainer } from "./ResultsList";
import { ActiveFiltersElement } from "./ActiveFiltersElement";
import { BucketAggregationValuesElement } from "./BucketAggregationValuesElement";
import { CountElement } from "./ResultCount";
import { EmptyResultsElement } from "./EmptyResultsElement";
import { ErrorElement } from "./ErrorElement";
import { SearchAppFacets } from "./SearchAppFacets";
import { SearchAppLayout } from "./SearchAppLayout";
import { SearchAppResultOptions } from "./SearchAppResultOptions";
import { SearchAppSearchbarContainer } from "./SearchAppSearchbarContainer";
import { SearchAppSort } from "./SearchAppSort";
import { SearchAppResults } from "./SearchAppResults";
import { FoldableBucketAggregationElement } from "./FoldableBucketAggregationElement";
import { ClearableSearchbarElement } from "./ClearableSearchbarElement";
import { loadAppComponents } from "../util";
import { RDMToggleComponent } from "@js/invenio_app_rdm/search/components";

export function parseSearchAppConfigs(
  configDataAttr = "invenio-search-config"
) {
  const searchAppRoots = [
    ...document.querySelectorAll(`[data-${configDataAttr}]`),
  ];

  return searchAppRoots.map((rootEl) => {
    const config = JSON.parse(rootEl.dataset[_camelCase(configDataAttr)]);
    return {
      rootEl,
      ...config,
    };
  });
}

export function createSearchAppsInit({
  componentOverrides = {},
  autoInit = true,
  ContainerComponent = React.Fragment,
} = {}) {
  const initSearchApp = async ({ rootEl, overridableIdPrefix, ...config }) => {
    const SearchAppSearchbarContainerWithConfig = parametrize(
      SearchAppSearchbarContainer,
      { appName: overridableIdPrefix }
    );

    const defaultComponents = {
      [`${overridableIdPrefix}.ActiveFilters.element`]: ActiveFiltersElement,
      [`${overridableIdPrefix}.BucketAggregation.element`]:
        FoldableBucketAggregationElement,
      [`${overridableIdPrefix}.BucketAggregationValues.element`]:
        BucketAggregationValuesElement,
      [`${overridableIdPrefix}.Count.element`]: CountElement,
      [`${overridableIdPrefix}.EmptyResults.element`]: EmptyResultsElement,
      [`${overridableIdPrefix}.Error.element`]: ErrorElement,
      [`${overridableIdPrefix}.SearchApp.facets`]: SearchAppFacets,
      [`${overridableIdPrefix}.SearchApp.layout`]: SearchAppLayout,
      [`${overridableIdPrefix}.SearchApp.resultOptions`]:
        SearchAppResultOptions,
      [`${overridableIdPrefix}.SearchApp.searchbarContainer`]:
        SearchAppSearchbarContainerWithConfig,
      [`${overridableIdPrefix}.SearchFilters.Toggle.element`]:
        RDMToggleComponent,
      [`${overridableIdPrefix}.SearchApp.sort`]: SearchAppSort,
      [`${overridableIdPrefix}.SearchApp.results`]: SearchAppResults,
      [`${overridableIdPrefix}.SearchBar.element`]: ClearableSearchbarElement,
      [`${overridableIdPrefix}.ResultsList.container`]: ListItemContainer,
    };

    loadAppComponents({
      overridableIdPrefix,
      componentIds,
      defaultComponents,
      resourceConfigComponents: config.defaultComponents,
      componentOverrides,
    }).then(() => {
      ReactDOM.render(
        <ContainerComponent>
          <SearchApp
            config={config}
            // Use appName to namespace application components when overriding
            appName={overridableIdPrefix}
          />
        </ContainerComponent>,
        rootEl
      );
    });
  };

  if (autoInit) {
    const searchAppConfigs = parseSearchAppConfigs();
    searchAppConfigs.forEach((config) => initSearchApp(config));
  } else {
    return initSearchApp;
  }
}

export const _getResultBuckets = (resultsAggregations, aggName) => {
  const thisAggs = _get(resultsAggregations, aggName, {});
  if ("buckets" in thisAggs) {
    if (!Array.isArray(thisAggs["buckets"])) {
      thisAggs["buckets"] = Object.entries(thisAggs["buckets"]).map(
        ([key, value]) => ({
          ...value,
          key,
        })
      );
    }
    return thisAggs["buckets"];
  }
  return [];
};

export const _getResultsStats = (resultsAggregations, aggName) => {
  const thisAggs = _get(resultsAggregations, aggName, {});
  return thisAggs.value;
};
