import React from "react";
import {
    SearchApp
} from "@js/invenio_search_ui/components";
import { loadComponents } from "@js/invenio_theme/templates";
import _camelCase from "lodash/camelCase";
import ReactDOM from "react-dom";


export function createSearchAppInit ({
    defaultComponentOverrides,
    autoInit = true,
    autoInitDataAttr = "invenio-search-config",
    multi = false,
    ContainerComponent = React.Fragment
}) {
    const initSearchApp = (rootElement) => {
        const { appId, ...config } = JSON.parse(
            rootElement.dataset[_camelCase(autoInitDataAttr)]
        );

        loadComponents(appId, { ...config.defaultComponents, ...defaultComponentOverrides }).then((res) => {
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
