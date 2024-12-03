import _map from "lodash/map";
import _reduce from "lodash/reduce";
import _uniqBy from "lodash/uniqBy";
import _isString from "lodash/isString";
import * as Yup from "yup";
import { i18next } from "@translations/oarepo_ui/i18next";
import { format } from "date-fns";
import axios from "axios";
import { overrideStore } from "react-overridable";

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

export async function importTemplate(templateName) {
  const module = await import(`@templates/${templateName}`);
  return module.default;
}

export async function registerComponent(componentId, defaultComponent) {
  // default component is either a component or a path relative to templates folder
  let component = null;
  const storeComponents = overrideStore.getAll();
  try {
    // First look into the prefixed path for the component
    component = await importTemplate(`${defaultComponent}.jsx`);
  } catch (error) {
    if (defaultComponent) {
      // If a string was specified, try to import it
      if (_isString(defaultComponent)) {
        try {
          component = await importTemplate(`${defaultComponent}.jsx`);
        } catch (error) {
          console.error(
            `Failed to import default component ${defaultComponent}.jsx`
          );
        }
      } else {
        component = defaultComponent;
      }
    }
  } finally {
    if (component && !storeComponents.hasOwnProperty(componentId)) {
      overrideStore.add(componentId, component);
      return component;
    }
  }
}

export function loadComponents(defaultComponents) {
  const tplPromises = [];
  for (const [componentId, component] of Object.entries(defaultComponents)) {
    tplPromises.push(registerComponent(componentId, component));
  }
  return Promise.all(tplPromises);
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

export const scrollToElement = (fieldPath) => {
  const findElementAtPath = (path) => {
    const element =
      document.querySelector(`label[for="${path}"]`) ||
      document.getElementById(path);
    return element;
  };

  const splitPath = fieldPath.split(".");

  for (let i = splitPath.length; i > 0; i--) {
    const partialPath = splitPath.slice(0, i).join(".");
    const element = findElementAtPath(partialPath);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
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

export const getValueFromMultilingualArray = (multilingualArray) => {
  if (!multilingualArray || multilingualArray.length === 0) {
    return null;
  } else {
    const value =
      multilingualArray.find((a) => a.lang === i18next.language)?.value ||
      multilingualArray[0].value;
    return value;
  }
};

// Date utils

export function getLocaleObject(localeSpec) {
  if (typeof localeSpec === "string") {
    // Treat it as a locale name registered by registerLocale
    const scope = window;
    // Null was replaced with undefined to avoid type coercion
    return scope.__localeData__ ? scope.__localeData__[localeSpec] : undefined;
  } else {
    // Treat it as a raw date-fns locale object
    return localeSpec;
  }
}

export function getDefaultLocale() {
  const scope = window;

  return scope.__localeId__;
}

// function that can be used anywhere in code (where React is used), after the component uses useLoadLocaleObjects hook to
// load the locale objects into the window object
export function formatDate(date, formatStr, locale) {
  if (locale === "en") {
    return format(date, formatStr, {
      useAdditionalWeekYearTokens: true,
      useAdditionalDayOfYearTokens: true,
    });
  }
  let localeObj = locale ? getLocaleObject(locale) : undefined;
  // it spams the console too much, because on load the objects are not available at first
  // if (locale && !localeObj) {
  //   console.warn(
  //     `A locale object was not found for the provided string ["${locale}"].`
  //   );
  // }
  if (
    !localeObj &&
    !!getDefaultLocale() &&
    !!getLocaleObject(getDefaultLocale())
  ) {
    localeObj = getLocaleObject(getDefaultLocale());
  }
  return format(date, formatStr, {
    locale: localeObj,
    useAdditionalWeekYearTokens: true,
    useAdditionalDayOfYearTokens: true,
  });
}

// function to take the user back to previous page, in case the page
// was visited from external source i.e. by pasting the URL in the browser,
// takes you back to the home page
export const goBack = (fallBackURL = "/") => {
  const referrer = document.referrer;

  if (referrer?.startsWith(window.location.origin)) {
    window.history.back();
  } else {
    window.location.href = fallBackURL;
  }
};

// until we start using v4 of react-invenio-forms. They switched to vnd zenodo accept header
const baseAxiosConfigurationApplicationJson = {
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};

const baseAxiosConfigurationVnd = {
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    Accept: "application/vnd.inveniordm.v1+json",
    "Content-Type": "application/json",
  },
};

export const httpApplicationJson = axios.create(
  baseAxiosConfigurationApplicationJson
);

export const httpVnd = axios.create(baseAxiosConfigurationVnd);

export const encodeUnicodeBase64 = (str) => {
  return btoa(encodeURIComponent(str));
};

export const decodeUnicodeBase64 = (base64) => {
  return decodeURIComponent(atob(base64));
};
