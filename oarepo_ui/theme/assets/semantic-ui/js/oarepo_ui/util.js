import _map from "lodash/map";
import _reduce from "lodash/reduce";
import _capitalize from "lodash/capitalize";
import { importTemplate } from "@js/invenio_theme/templates";

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
  return new URL(urlString, window.location.origin)
}

export const relativeUrl = (urlString) => {
  const {pathname, search} = absoluteUrl(urlString)
  return `${pathname}${search}`
}

export async function dynamicLoadComponents(overridableIdPrefix, componentIds) {
  const asyncImportTemplate = async (componentId, path) => {
    console.log(`Searching for component '${componentId}' in ${path}`)
    try {
      return {
        componentId,
        component: await importTemplate(path),
      };
    } catch (err) {
      return null;
    }
  };

  const components = componentIds.map((componentId) => {
    const componentFilename = componentId
      .split(".")
      .map((part) => _capitalize(part))
      .join("");
    return asyncImportTemplate(
      `${overridableIdPrefix}.${componentId}`,
      `${overridableIdPrefix}/${componentFilename}.jsx`
    );
  });

  const loadedComponents = await Promise.all(components);
  return loadedComponents
    .filter((component) => component !== null)
    .reduce((res, { componentId, component }) => {
      res[componentId] = component;
      return res;
    }, {});
}