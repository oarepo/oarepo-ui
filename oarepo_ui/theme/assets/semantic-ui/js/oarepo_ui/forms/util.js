import React from "react";
import ReactDOM from "react-dom";
import { getInputFromDOM, CompactFieldLabel } from "@js/oarepo_ui";
import { FormConfigProvider } from "./contexts";
import { Container } from "semantic-ui-react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loadAppComponents } from "../util";
import { overridableComponentIds as componentIds } from "./constants";
import { buildUID } from "react-searchkit";
import _get from "lodash/get";
import { FieldLabel } from "react-invenio-forms";
import { i18next } from "@translations/i18next";
import Overridable, {
  OverridableContext,
  overrideStore,
} from "react-overridable";
import { BaseFormLayout } from "./components/BaseFormLayout";

export function parseFormAppConfig(rootElementId = "form-app") {
  const rootEl = document.getElementById(rootElementId);
  const record = getInputFromDOM("record");
  const formConfig = getInputFromDOM("form-config");
  const recordPermissions = getInputFromDOM("record-permissions");
  const files = getInputFromDOM("files");
  const links = getInputFromDOM("links");
  formConfig.getFieldData = getFieldData(formConfig.ui_model);

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
  componentOverrides = {},
} = {}) {
  const initFormApp = async ({ rootEl, ...config }) => {
    console.debug("Initializing Formik form app...");
    console.debug({ ...config });

    const overridableIdPrefix = config.formConfig.overridableIdPrefix;

    loadAppComponents({
      overridableIdPrefix,
      componentIds,
      resourceConfigComponents: config.formConfig.defaultComponents,
      componentOverrides,
    }).then(() => {
      ReactDOM.render(
        <ContainerComponent>
          <QueryClientProvider client={queryClient}>
            <Router>
              <OverridableContext.Provider value={overrideStore.getAll()}>
                <FormConfigProvider value={config}>
                  <Overridable
                    id={buildUID(overridableIdPrefix, "FormApp.layout")}
                  >
                    <Container fluid>
                      <BaseFormLayout />
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

export const getFieldData = (uiMetadata) => {
  // explore options of using context to pass the data from ui json to nested fields in modal
  return (fieldPath, icon = "pencil") => {
    const path = transformPath(fieldPath);
    const { help, label, hint, required } = _get(uiMetadata, path);
    // full representation meaning jsx or small space representation (no helptext, label with helptext in popup)
    // text only without react elements
    return {
      fullRepresentation: {
        helpText: i18next.t(help),
        label: (
          <FieldLabel
            htmlFor={fieldPath}
            icon={icon}
            label={i18next.t(label)}
          />
        ),
        placeholder: i18next.t(hint),
        required,
      },
      compactRepresentation: {
        helptext: undefined,
        label: (
          <CompactFieldLabel
            htmlFor={fieldPath}
            icon=""
            label={i18next.t(label)}
            popupHelpText={i18next.t(help)}
          />
        ),
        placeholder: i18next.t(hint),
      },
      textRepresentation: {
        helpText: i18next.t(help),
        label: i18next.t(label),
        placeholder: i18next.t(hint),
      },
    };
  };
};

export function transformPath(path) {
  // Split the path into components
  const parts = path.split(".");

  // Use reduce to build the new path
  const transformedParts = parts.map((part, index, array) => {
    if (index === 0) {
      return `children.${part}.children`;
    } else if (index === array.length - 1) {
      return part;
    } else if (!isNaN(parseInt(part))) {
      return `child.children`;
    } else if (!isNaN(parseInt(array[index + 1]))) {
      return part;
    } else {
      return `${part}.children`;
    }
  });
  // Join the transformed parts back into a single string
  return transformedParts.join(".");
}
