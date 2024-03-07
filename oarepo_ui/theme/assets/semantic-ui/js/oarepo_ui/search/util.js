import React from "react";
import { SearchApp } from "@js/invenio_search_ui/components";
import _camelCase from "lodash/camelCase";
import ReactDOM from "react-dom";
import { parametrize } from "react-overridable";
import { overridableComponentIds as componentIds } from "./constants";

import {
  ActiveFiltersElement,
  BucketAggregationElement,
  BucketAggregationValuesElement,
  CountElement,
  EmptyResultsElement,
  ErrorElement,
  SearchAppFacets,
  SearchAppLayout,
  SearchAppResultOptions,
  SearchAppSearchbarContainer,
  SearchFiltersToggleElement,
  SearchAppSort,
  SearchAppResults,
} from "@js/oarepo_ui/search";
import { loadAppComponents } from "../util";

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
        BucketAggregationElement,
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
        SearchFiltersToggleElement,
      [`${overridableIdPrefix}.SearchApp.sort`]: SearchAppSort,
      [`${overridableIdPrefix}.SearchApp.results`]: SearchAppResults,
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
