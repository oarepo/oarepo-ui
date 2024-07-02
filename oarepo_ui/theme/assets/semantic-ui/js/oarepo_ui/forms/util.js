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
import { decode } from "html-entities";
import sanitizeHtml from "sanitize-html";

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

const allowed_tags = [
  "a",
  "abbr",
  "acronym",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "table",
  "tbody",
  "td",
  "th",
  "tr",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strike",
  "strong",
  "sub",
  "sup",
  "u",
  "ul",
];

const allowed_attr = {
  a: ["href", "title", "name", "target", "rel"],
  abbr: ["title"],
  acronym: ["title"],
};

export const validTags = (tags = allowed_tags, attr = allowed_attr) => {
  const specialAttributes = Object.fromEntries(
    Object.entries(attr).map(([key, value]) => [key, value.join("|")])
  );

  return tags
    .map((tag) => {
      return specialAttributes[tag] ? `${tag}[${specialAttributes[tag]}]` : tag;
    })
    .join(",");
};

export const sanitizeInput = (htmlString, validTags) => {
  const decodedString = decode(htmlString);
  const cleanInput = sanitizeHtml(decodedString, {
    allowedTags: validTags || allowed_tags,
    allowedAttributes: allowed_attr,
  });
  return cleanInput;
};

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
  // explore options of using context to pass the data from ui json to nested fields in modal
  return (fieldPath, icon = "pencil") => {
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
      required: modelRequired,
    } = _get(uiMetadata, path);
    const help = i18next.t(modelHelp).startsWith("metadata")
      ? null
      : i18next.t(modelHelp);
    const label = i18next.t(modelLabel).startsWith("metadata")
      ? null
      : i18next.t(modelLabel);
    const hint = i18next.t(modelHint).startsWith("metadata")
      ? null
      : i18next.t(modelHint);
    const required = modelRequired;
    // full representation meaning jsx or small space representation (no helptext, label with helptext in popup)
    // text only without react elements
    return {
      fullRepresentation: {
        helpText: help,
        label: <FieldLabel htmlFor={fieldPath} icon={icon} label={label} />,
        placeholder: hint,
        required,
      },
      compactRepresentation: {
        helptext: help,
        label: (
          <CompactFieldLabel
            htmlFor={fieldPath}
            icon=""
            label={label}
            popupHelpText={help}
          />
        ),
        placeholder: hint,
      },
      textRepresentation: {
        helpText: help,
        label: label,
        placeholder: hint,
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
