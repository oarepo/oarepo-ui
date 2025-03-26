import React, { useMemo, memo } from "react";
import ReactDOM from "react-dom";
import { getInputFromDOM } from "@js/oarepo_ui/";
import { CompactFieldLabel } from "./components/CompactFieldLabel";
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
import { setIn } from "formik";
import _deburr from "lodash/deburr";
import _escapeRegExp from "lodash/escapeRegExp";
import _filter from "lodash/filter";

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
                  <FieldDataProvider>
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

const MemoizedFieldLabel = memo(FieldLabel);
const MemoizedCompactFieldLabel = memo(CompactFieldLabel);

export const getFieldData = (uiMetadata, fieldPathPrefix = "") => {
  return ({
    fieldPath,
    icon = "pencil",
    fullLabelClassName,
    compactLabelClassName,
    fieldRepresentation = "full",
    // escape hatch that allows you to use top most provider and provide full paths inside of deeply nested fields
    ignorePrefix = false,
  }) => {
    const fieldPathWithPrefix =
      fieldPathPrefix && !ignorePrefix
        ? `${fieldPathPrefix}.${fieldPath}`
        : fieldPath;

    // Handling labels, always taking result of i18next.t; if we get metadata/smth, we use it to debug
    // Help and hint: if result is same as the key, don't render; if it is different, render
    const path = toModelPath(fieldPathWithPrefix);

    const {
      help: modelHelp = undefined,
      label: modelLabel = undefined,
      hint: modelHint = undefined,
      required = undefined,
      detail = undefined,
    } = _get(uiMetadata, path) || {};

    const label = modelLabel ? i18next.t(modelLabel) : modelLabel;
    const help =
      i18next.t(modelHelp) === modelHelp ? null : i18next.t(modelHelp);
    const hint =
      i18next.t(modelHint) === modelHint ? null : i18next.t(modelHint);

    const memoizedResult = useMemo(() => {
      switch (fieldRepresentation) {
        case "full":
          return {
            helpText: help,
            label: (
              <MemoizedFieldLabel
                htmlFor={fieldPath}
                icon={icon}
                label={label}
                className={fullLabelClassName}
              />
            ),
            placeholder: hint,
            required,
            detail,
          };
        case "compact":
          return {
            label: (
              <MemoizedCompactFieldLabel
                htmlFor={fieldPath}
                icon={icon}
                label={label}
                popupHelpText={help}
                className={compactLabelClassName}
              />
            ),
            placeholder: hint,
            required,
            detail,
          };
        case "text":
          return {
            helpText: help,
            label: label,
            placeholder: hint,
            labelIcon: icon,
            required,
            detail,
          };
        default:
          throw new Error(
            `Unknown fieldRepresentation: ${fieldRepresentation}`
          );
      }
    }, [
      fieldPath,
      icon,
      label,
      help,
      hint,
      required,
      fieldRepresentation,
      fullLabelClassName,
      compactLabelClassName,
      detail,
    ]);

    return memoizedResult;
  };
};

export function toModelPath(path) {
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

export const serializeErrors = (
  errors,
  message = i18next.t(
    "Draft saved with validation errors. Fields listed below that failed validation were not saved to the server"
  )
) => {
  if (errors?.length > 0) {
    let errorsObj = {};
    const errorPaths = [];
    for (const error of errors) {
      errorsObj = setIn(errorsObj, error.field, error.messages.join(" "));
      errorPaths.push(error.field);
    }

    errorsObj["BEvalidationErrors"] = {
      errors: errors,
      errorMessage: message,
      errorPaths,
    };

    return errorsObj;
  } else {
    return {};
  }
};

// custom search function to avoid the issue of not being able to search
// through text in react nodes that are our dropdown options
// requires also name to be returned in serializer which is actually a text
// value
export const search = (filteredOptions, searchQuery, searchKey = "name") => {
  const strippedQuery = _deburr(searchQuery);

  const re = new RegExp(_escapeRegExp(strippedQuery), "i");

  filteredOptions = _filter(filteredOptions, (opt) =>
    re.test(_deburr(opt[searchKey]))
  );
  return filteredOptions;
};
