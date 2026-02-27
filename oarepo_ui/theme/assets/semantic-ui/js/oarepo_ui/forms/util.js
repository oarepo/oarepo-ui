import React, { useMemo, memo } from "react";
import { getInputFromDOM, getLocalizedValue } from "../util";
import { CompactFieldLabel } from "./components/CompactFieldLabel";
import _get from "lodash/get";
import { FieldLabel } from "react-invenio-forms";
import _deburr from "lodash/deburr";
import _escapeRegExp from "lodash/escapeRegExp";
import _filter from "lodash/filter";
import _isObject from "lodash/isObject";
import _isDate from "lodash/isDate";
import _isRegExp from "lodash/isRegExp";
import _forOwn from "lodash/forOwn";

export function parseFormAppConfig(rootElementId = "deposit-form") {
  const rootEl = document.getElementById(rootElementId);

  return {
    rootEl,
    record: getInputFromDOM("deposits-record"),
    preselectedCommunity: getInputFromDOM("deposits-draft-community"),
    files: getInputFromDOM("deposits-record-files"),
    config: getInputFromDOM("deposits-config"),
    useUppy: getInputFromDOM("deposits-use-uppy-ui"),
    permissions: getInputFromDOM("deposits-record-permissions"),
    filesLocked: getInputFromDOM("deposits-record-locked-files"),
    recordRestrictionGracePeriod: getInputFromDOM(
      "deposits-record-restriction-grace-period"
    ),
    allowRecordRestriction: getInputFromDOM(
      "deposits-allow-record-restriction"
    ),
    recordDeletion: getInputFromDOM("deposits-record-deletion"),
    groupsEnabled: getInputFromDOM("config-groups-enabled"),
    allowEmptyFiles: getInputFromDOM("records-resources-allow-empty-files"),
    isDoiRequired: getInputFromDOM("deposits-is-doi-required"),
    links: getInputFromDOM("deposits-links"),
  };
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

    const label = modelLabel ? getLocalizedValue(modelLabel) : path;
    const help = modelHelp ? getLocalizedValue(modelHelp) : null;
    const hint = modelHint ? getLocalizedValue(modelHint) : null;

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
    } else if (!Number.isNaN(Number.parseInt(part))) {
      return `child.children`;
    } else if (Number.isNaN(Number.parseInt(array[index + 1]))) {
      return `${part}.children`;
    } else {
      return part;
    }
  });
  // Join the transformed parts back into a single string
  return transformedParts.join(".");
}

export const getValidTagsForEditor = (tags = [], attr = {}) => {
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

/**
 * Finds the index of the form section that contains a given field path.
 *
 * @param {Array<{key: string, includesPaths?: string[]}>} sections - Array of section objects with includesPaths
 * @param {string} fieldPath - The field path to search for (e.g., "metadata.title" or "metadata.creators.0.name")
 * @returns {number} The index of the matching section, or -1 if not found
 *
 * @example
 * const sections = [
 *   { key: "basic", includesPaths: ["metadata.title", "metadata.description"] },
 *   { key: "creators", includesPaths: ["metadata.creators"] }
 * ];
 * findSectionIndexForFieldPath(sections, "metadata.creators.0.name"); // returns 1
 */
export const findSectionIndexForFieldPath = (sections, fieldPath) => {
  if (!sections || !fieldPath) return -1;
  return sections.findIndex((section) =>
    section.includesPaths?.some(
      (path) => fieldPath === path || fieldPath.startsWith(`${path}.`)
    )
  );
};

/**
 * Checks if an object is an error leaf node in the new error format.
 * New format errors have `message`, `severity`, and `description` properties.
 *
 * @param {*} obj - The value to check
 * @returns {boolean} True if the object is a new format error object
 *
 * @example
 * // New format error object
 * isErrorObject({ message: "Required", severity: "error", description: "Field must not be empty" }); // true
 *
 * // Old format (plain string)
 * isErrorObject("Required"); // false
 */
export const isErrorObject = (obj) =>
  _isObject(obj) &&
  "message" in obj &&
  "severity" in obj &&
  "description" in obj;

/**
 * Flattens a nested error object into an array of { fieldPath, value } pairs.
 * Handles both old format (string values) and new format (objects with message/severity/description).
 *
 * @param {Object} obj - The nested error object to flatten
 * @param {string} [prefix=""] - Internal parameter for building field paths during recursion
 * @param {Array} [res=[]] - Internal parameter for accumulating results during recursion
 * @returns {Array<{fieldPath: string, value: string|Object}>} Array of flattened errors
 *
 * @example
 * // Old format (string errors)
 * flattenToPathValueArray({ metadata: { title: "Required" } });
 * // Returns: [{ fieldPath: "metadata.title", value: "Required" }]
 *
 * @example
 * // New format (object errors)
 * flattenToPathValueArray({
 *   metadata: {
 *     title: { message: "Required", severity: "error", description: "Must provide title" }
 *   }
 * });
 * // Returns: [{ fieldPath: "metadata.title", value: { message: "Required", severity: "error", description: "Must provide title" } }]
 */
export function flattenToPathValueArray(obj, prefix = "", res = []) {
  if (
    _isObject(obj) &&
    !_isDate(obj) &&
    !_isRegExp(obj) &&
    obj !== null &&
    !isErrorObject(obj)
  ) {
    _forOwn(obj, (value, key) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      flattenToPathValueArray(value, newKey, res);
    });
  } else {
    res.push({ fieldPath: prefix, value: obj });
  }
  return res;
}
