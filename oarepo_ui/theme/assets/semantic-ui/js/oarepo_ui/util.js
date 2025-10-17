import _isEmpty from "lodash/isEmpty";
import _uniqBy from "lodash/uniqBy";
import * as Yup from "yup";
import { i18next } from "@translations/oarepo_ui/i18next";
import { format } from "date-fns";
import axios from "axios";
import { DateTime } from "luxon";

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

export const object2array = (obj, keyName, valueName) => {
  // Transforms object to array of objects.
  // Each key of original object will be stored as value of `keyName` key.
  // Each value of original object will be stored as value of `valueName` key.
  if (_isEmpty(obj)) {
    return [];
  }

  return Object.entries(obj).map(([key, value]) => ({
    [keyName]: key,
    [valueName]: value,
  }));
};

export function array2object(arr, keyName, valueName) {
  // Transforms an array of objects to a single object.
  // For each array item, it sets a key given by array item `keyName` value,
  // with a value of array item's `valueName` key.
  if (!Array.isArray(arr) || arr.length === 0) {
    return {};
  }
  return arr.reduce((result, item) => {
    result[item[keyName]] = item[valueName];
    return result;
  }, {});
}

/**
 * Checks if the array contains unique values for a given key (or the whole item).
 * Used as a custom test function in Yup validation schemas to ensure uniqueness.
 *
 * @param {Array} value - The array to validate.
 * @param {Object} context - Yup validation context (contains path, parent, etc).
 * @param {string} path - The key in each object to check for uniqueness (optional).
 * @param {string} errorString - The error message to use for duplicates.
 * @returns {true|Yup.ValidationError} Returns true if unique, otherwise a ValidationError.
 */

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

/**
 * Return the best localized value from either a multilingual object or array.
 *
 * Supports both:
 * - Object shape: { en: "Hello", cs: "Ahoj" }
 * - Array shape: [{ lang: "en", value: "Hello" }, { lang: "cs", value: "Ahoj" }]
 *
 * The lookup order is:
 *  1. Exact locale match
 *  2. English (`"en"`)
 *  3. Fallback language defined in i18next (`i18next.options.fallbackLng`)
 *  4. Any available key except `"und"`
 *  5. `"und"` key (undefined locale)
 *  6. Default fallback value (if nothing else is found)
 */
export const getLocalizedValue = (multilingualData, defaultFallback = null) => {
  if (!multilingualData) {
    return defaultFallback;
  }

  if (typeof multilingualData === "string") {
    return multilingualData;
  }

  const fullLocale = i18next.language || "en";
  const shortLocale = fullLocale.split("_")[0];
  const fallbackLocale = i18next.options?.fallbackLng || "en";

  // normalize to array of { lang, value }
  const entries = Array.isArray(multilingualData)
    ? multilingualData
    : Object.entries(multilingualData).map(([lang, value]) => ({
        lang,
        value,
      }));

  const find = (lang) => entries.find((e) => e.lang === lang)?.value ?? null;

  // Lookup value
  return (
    find(fullLocale) ||
    find(shortLocale) ||
    find("en") ||
    find(fallbackLocale) ||
    entries.find((e) => e.lang && e.lang !== "und")?.value ||
    find("und") ||
    defaultFallback
  );
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

/**
 * Returns a human readable timestamp in the format "4 days ago".
 *
 * @param {Date} timestamp
 * @returns string
 */
export const timestampToRelativeTime = (timestamp) =>
  DateTime.fromISO(timestamp).setLocale(i18next.language).toRelative();
