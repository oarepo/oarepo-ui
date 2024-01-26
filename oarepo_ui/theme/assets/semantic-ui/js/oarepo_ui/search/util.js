import React from "react";
import { SearchApp } from "@js/invenio_search_ui/components";
import { loadComponents } from "@js/invenio_theme/templates";
import _camelCase from "lodash/camelCase";
import ReactDOM from "react-dom";
import { parametrize } from 'react-overridable'

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
} from "@js/oarepo_ui/search";



export function createSearchAppInit ({
    defaultComponentOverrides,
    autoInit = true,
    autoInitDataAttr = "invenio-search-config",
    multi = true,
    ContainerComponent = React.Fragment,
}) {
    const initSearchApp = (rootElement) => {
        const { appId, ...config } = JSON.parse(
            rootElement.dataset[_camelCase(autoInitDataAttr)]
        );

        const SearchAppSearchbarContainerWithConfig = parametrize(SearchAppSearchbarContainer, { appName: appId })
        const internalComponentDefaults = {
            [`${appId}.ActiveFilters.element`]: ActiveFiltersElement,
            [`${appId}.BucketAggregation.element`]: BucketAggregationElement,
            [`${appId}.BucketAggregationValues.element`]: BucketAggregationValuesElement,
            [`${appId}.Count.element`]: CountElement,
            [`${appId}.EmptyResults.element`]: EmptyResultsElement,
            [`${appId}.Error.element`]: ErrorElement,
            [`${appId}.SearchApp.facets`]: SearchAppFacets,
            [`${appId}.SearchApp.layout`]: SearchAppLayout,
            [`${appId}.SearchApp.resultOptions`]: SearchAppResultOptions,
            [`${appId}.SearchApp.searchbarContainer`]: SearchAppSearchbarContainerWithConfig,
            [`${appId}.SearchFilters.Toggle.element`]: SearchFiltersToggleElement,
            [`${appId}.SearchApp.sort`]: SearchAppSort,
        };

        loadComponents(appId, {
            ...internalComponentDefaults,
            ...config.defaultComponents,
            ...defaultComponentOverrides,
        }).then((res) => {
            ReactDOM.render(
                <ContainerComponent>
                    <SearchApp
                        config={config}
                        // Use appName to namespace application components when overriding
                        {...(multi && { appName: appId })}
                    />
                </ContainerComponent>,
                rootElement
            );
        });
    };

    if (autoInit) {
        const searchAppElements = document.querySelectorAll(
            `[data-${autoInitDataAttr}]`
        );
        for (const appRootElement of searchAppElements) {
            initSearchApp(appRootElement);
        }
    } else {
        return initSearchApp;
    }
}
