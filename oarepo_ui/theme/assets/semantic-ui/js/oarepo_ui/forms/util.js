import { loadComponents } from "@js/invenio_theme/templates";
import React from "react";
import ReactDOM from "react-dom";
import { getInputFromDOM } from "@js/oarepo_ui";
import { FormConfigProvider } from "./contexts";
import { Container } from "semantic-ui-react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loadDynamicComponents } from "../util";

import Overridable, {
  OverridableContext,
  overrideStore,
} from "react-overridable";

export function parseFormAppConfig(rootElementId = "form-app") {
  const rootEl = document.getElementById(rootElementId);
  const record = getInputFromDOM("record");
  const formConfig = getInputFromDOM("form-config");
  const recordPermissions = getInputFromDOM("record-permissions");
  const files = getInputFromDOM("files");
  const links = getInputFromDOM("links");

  return { rootEl, record, formConfig, recordPermissions, files, links };
}

/**
 * Initialize Formik form application.
 * @function
 * @param {object} defaultComponents - default components to load if no overriden have been registered.
 * @param {boolean} autoInit - if true then the application is getting registered to the DOM.
 * @returns {object} renderable React object
 */
const queryClient = new QueryClient();
export function createFormAppInit({
  autoInit = true,
  ContainerComponent = React.Fragment,
  defaultComponentOverrides = {},
} = {}) {
  const initFormApp = async ({ rootEl, ...config }) => {
    console.debug("Initializing Formik form app...");
    console.debug({ ...config });

    const overridableIdPrefix = config.formConfig.overridableIdPrefix;

    const internalComponentDefaults = {};
    const dynamicComponents = await loadDynamicComponents(
      overridableIdPrefix,
      overridableComponentIds
    );

    const components = {
      ...internalComponentDefaults,
      ...config.formConfig.defaultComponents,
      ...defaultComponentOverrides,
      ...dynamicComponents,
    };

    loadComponents(overridableIdPrefix, components).then((res) => {
      ReactDOM.render(
        <ContainerComponent>
          <QueryClientProvider client={queryClient}>
            <Router>
              <OverridableContext.Provider value={overrideStore.getAll()}>
                <FormConfigProvider value={config}>
                  <Overridable id={`${overridableIdPrefix}.layout`}>
                    <Container fluid>
                      <p>
                        Provide your form components here by overriding
                        component id "{`${overridableIdPrefix}.layout`}"
                      </p>
                    </Container>
                  </Overridable>
                </FormConfigProvider>
              </OverridableContext.Provider>
            </Router>
          </QueryClientProvider>
        </ContainerComponent>,
        rootEl
      );
    });
  };

  if (autoInit) {
    const appConfig = parseFormAppConfig();
    initFormApp(appConfig);
  } else {
    return initFormApp;
  }
}
