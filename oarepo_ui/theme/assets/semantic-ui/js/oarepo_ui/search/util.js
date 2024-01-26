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

        const componentPrefix = multi ? `${appId}.` : ''
        const SearchAppSearchbarContainerWithConfig = parametrize(SearchAppSearchbarContainer, { appName: appId })
        const internalComponentDefaults = {
            [`${componentPrefix}ActiveFilters.element`]: ActiveFiltersElement,
            [`${componentPrefix}BucketAggregation.element`]: BucketAggregationElement,
            [`${componentPrefix}BucketAggregationValues.element`]: BucketAggregationValuesElement,
            [`${componentPrefix}Count.element`]: CountElement,
            [`${componentPrefix}EmptyResults.element`]: EmptyResultsElement,
            [`${componentPrefix}Error.element`]: ErrorElement,
            [`${componentPrefix}SearchApp.facets`]: SearchAppFacets,
            [`${componentPrefix}SearchApp.layout`]: SearchAppLayout,
            [`${componentPrefix}SearchApp.resultOptions`]: SearchAppResultOptions,
            [`${componentPrefix}SearchApp.searchbarContainer`]: SearchAppSearchbarContainerWithConfig,
            [`${componentPrefix}SearchFilters.Toggle.element`]: SearchFiltersToggleElement,
            [`${componentPrefix}SearchApp.sort`]: SearchAppSort,
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
