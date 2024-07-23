import React from "react";
import ReactDOM from "react-dom";
import { getInputFromDOM, CompactFieldLabel } from "@js/oarepo_ui";
import { FormConfigProvider, FieldDataProvider } from "./contexts";
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
                  <FieldDataProvider
                    value={{
                      getFieldData: getFieldData(config.formConfig.ui_model),
                    }}
                  >
                    <Overridable
                      id={buildUID(overridableIdPrefix, "FormApp.layout")}
                    >
                      <Container fluid>
                        <BaseFormLayout />
                      </Container>
                    </Overridable>
                  </FieldDataProvider>
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

export const getFieldData = (uiMetadata, fieldPathPrefix = "") => {
  return ({
    fieldPath,
    icon = "pencil",
    fullLabelClassName,
    compactLabelClassName,
  }) => {
    const fieldPathWithPrefix = fieldPathPrefix
      ? `${fieldPathPrefix}.${fieldPath}`
      : fieldPath;
    // handling labels, always I take result of i18next.t if we get metadata/smth, we use it to debug
    // help and hint if result is same as the key, don't render, if it is different render
    const path = transformPath(fieldPathWithPrefix);
    const {
      help: modelHelp,
      label: modelLabel,
      hint: modelHint,
      required,
    } = _get(uiMetadata, path);
    const label = i18next.t(modelLabel);
    const help =
      i18next.t(modelHelp) === modelHelp ? null : i18next.t(modelHelp);
    const hint =
      i18next.t(modelHint) === modelHint ? null : i18next.t(modelHint);
    // full representation meaning jsx or small space representation (label with helptext in popup)
    // text only without react elements
    return {
      fullRepresentation: {
        helpText: help,
        label: (
          <FieldLabel
            htmlFor={fieldPath}
            icon={icon}
            label={label}
            className={fullLabelClassName}
          />
        ),
        placeholder: hint,
        required,
      },
      compactRepresentation: {
        helptext: help,
        label: (
          <CompactFieldLabel
            htmlFor={fieldPath}
            icon={icon}
            label={label}
            popupHelpText={help}
            className={compactLabelClassName}
          />
        ),
        placeholder: hint,
        required,
      },
      textRepresentation: {
        helpText: help,
        label: label,
        placeholder: hint,
        labelIcon: icon,
        required,
      },
    };
  };
};

export function transformPath(path) {
  // Split the path into components
  const parts = path.split(".");

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

export const getValidTagsForEditor = (tags, attr) => {
  const specialAttributes = Object.fromEntries(
    Object.entries(attr).map(([key, value]) => [key, value.join("|")])
  );
  let result = [];

  if (specialAttributes["*"]) {
    result.push(`@[${specialAttributes["*"]}]`);
  }

  result = result.concat(
    tags.map((tag) => {
      return specialAttributes[tag] ? `${tag}[${specialAttributes[tag]}]` : tag;
    })
  );

  return result.join(",");
};
