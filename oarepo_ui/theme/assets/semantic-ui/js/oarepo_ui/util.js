import _map from "lodash/map";
import _reduce from "lodash/reduce";
import _camelCase from "lodash/camelCase";
import _startCase from "lodash/startCase";
import { importTemplate, loadComponents } from "@js/invenio_theme/templates";
import _uniqBy from "lodash/uniqBy";
import * as Yup from "yup";
import { i18next } from "@translations/oarepo_ui/i18next";

export const getInputFromDOM = (elementName) => {
  const element = document.getElementsByName(elementName);
  if (element.length > 0 && element[0].hasAttribute("value")) {
    return JSON.parse(element[0].value);
  }
  return null;
};

export const scrollTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "smooth",
  });
};

export const object2array = (obj, keyName, valueName) =>
  // Transforms object to array of objects.
  // Each key of original object will be stored as value of `keyName` key.
  // Each value of original object will be stored as value of `valueName` key.

  _map(obj, (value, key) => ({
    [keyName]: key,
    [valueName]: value,
  }));

export const array2object = (arr, keyName, valueName) =>
  // Transforms an array of objects to a single object.
  // For each array item, it sets a key given by array item `keyName` value,
  // with a value of array item's `valueVame` key.

  _reduce(
    arr,
    (result, item) => {
      result[item[keyName]] = item[valueName];
      return result;
    },
    {}
  );

export const absoluteUrl = (urlString) => {
  return new URL(urlString, window.location.origin);
};

export const relativeUrl = (urlString) => {
  const { pathname, search } = absoluteUrl(urlString);
  return `${pathname}${search}`;
};

export async function loadTemplateComponents(
  overridableIdPrefix,
  componentIds
) {
  const asyncImportTemplate = async (componentId, path) => {
    console.log(`Searching for component ID '${componentId}' in ${path}`);
    try {
      return {
        componentId,
        component: await importTemplate(path),
      };
    } catch (err) {
      if (err.message.startsWith("Cannot find module")) {
        console.debug(
          `Component '${componentId}' not found in ${path}. Skipping.`
        );
      } else {
        console.error(
          `Error loading component '${componentId}' from ${path}: ${err}`
        );
      }
      return null;
    }
  };

  const components = componentIds.map((componentId) => {
    const componentFilename = _startCase(_camelCase(componentId)).replace(
      / /g,
      ""
    );

    const baseDir = overridableIdPrefix
      .split(".")
      .map((dir) => dir.toLowerCase())
      .join("/");
    return asyncImportTemplate(
      `${overridableIdPrefix}.${componentId}`,
      `${baseDir}/${componentFilename}.jsx`
    );
  });

  const loadedComponents = await Promise.all(components);
  const componentOverrides = loadedComponents
    .filter((component) => component !== null)
    .reduce((res, { componentId, component }) => {
      res[componentId] = component;
      return res;
    }, {});

  return componentOverrides;
}

export async function loadAppComponents({
  overridableIdPrefix,
  componentIds = [],
  defaultComponents = {},
  resourceConfigComponents = {},
  componentOverrides = {},
}) {
  const templateComponents = await loadTemplateComponents(
    overridableIdPrefix,
    componentIds
  );

  const components = {
    ...defaultComponents,
    ...resourceConfigComponents,
    ...componentOverrides,
    ...templateComponents,
  };

  return loadComponents(overridableIdPrefix, components);
}

// functions to help with validation schemas
export const requiredMessage = ({ label }) =>
  `${label} ${i18next.t("is a required field")}`;

export const returnGroupError = (value, context) => {
  return i18next.t("Items must be unique");
};

export const invalidUrlMessage = i18next.t(
  "Please provide an URL in valid format"
);
export const unique = (value, context, path, errorString) => {
  if (!value || value.length < 2) {
    return true;
  }

  if (
    _uniqBy(value, (item) => (path ? item[path] : item)).length !== value.length
  ) {
    const errors = value
      .map((value, index) => {
        return new Yup.ValidationError(
          errorString,
          value,
          path ? `${context.path}.${index}.${path}` : `${context.path}.${index}`
        );
      })
      .filter(Boolean);
    return new Yup.ValidationError(errors);
  }
  return true;
};

export const scrollToElement = (querySelector) => {
  const element = document.querySelector(querySelector);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

//In some instances the I18nString component is problematic to use,
// because it is actually a React node and not a string (i.e. text value
// for drop down options)
export const getTitleFromMultilingualObject = (multilingualObject) => {
  if (!multilingualObject) {
    return null;
  }
  if (typeof multilingualObject === "string") {
    return multilingualObject;
  }
  const localizedValue =
    multilingualObject[i18next.language] ||
    multilingualObject[i18next.options.fallbackLng] ||
    Object.values(multilingualObject)?.shift();

  return localizedValue;
};
