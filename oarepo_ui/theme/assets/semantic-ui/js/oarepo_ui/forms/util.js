import React from "react";
import ReactDOM from "react-dom";
import { getInputFromDOM } from "@js/oarepo_ui";
import { FormConfigProvider } from "./contexts";
import { Container } from "semantic-ui-react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { loadAppComponents } from "../util";
import { overridableComponentIds as componentIds } from "./constants";
import { buildUID } from "react-searchkit";
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

export const sanitizeInput = (htmlString, validTags) => {
  const decodedString = decode(htmlString);
  const cleanInput = sanitizeHtml(decodedString, {
    allowedTags: validTags || allowed_tags,
    allowedAttributes: {
      a: ["href", "title", "name", "target", "rel"],
      abbr: ["title"],
      acronym: ["title"],
    },
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
