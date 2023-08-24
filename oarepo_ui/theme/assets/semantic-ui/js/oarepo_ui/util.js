import _map from "lodash/map";
import _reduce from "lodash/reduce";
import _omitBy from "lodash/omitBy";
import _omit from "lodash/omit";
import _isObject from "lodash/isObject";
import _mapValues from "lodash/mapValues";
import _isArray from "lodash/isArray";

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

export const eliminateUsedLanguages = (
  excludeIndex,
  languageOptions,
  fieldArray
) => {
  const currentlySelectedLanguage = fieldArray[excludeIndex].lang;
  const excludedLanguages = fieldArray.filter(
    (item) => item.lang !== currentlySelectedLanguage && item.lang
  );
  const remainingLanguages = languageOptions.filter(
    (option) =>
      !excludedLanguages.map((item) => item.lang).includes(option.value)
  );
  return remainingLanguages;
};

const removeKeyFromNestedObjects = (inputObject) => {
  const processArray = (arr) => {
    return arr.map((item) => {
      if (_isObject(item)) {
        return _omit(item, "__key");
      }
      return item;
    });
  };

  const processObject = (obj) => {
    return _mapValues(obj, (value) => {
      if (_isArray(value)) {
        return processArray(value);
      }
      return value;
    });
  };

  return processObject(inputObject);
};

// this function is a temporary solution for removing __key properties from arrayField items in formik's state
// before we submit. The function is kind of similar to the one in vocabularies, but also cannot be reused
// as vocabularies have only one arrayField and we keep the actual state with __key in _fieldName, which is deleted
// before submitting
// the problem with this implementation is if I have arrayFild within arrayField, it will not remove __key
// from internal arrayField (i.e. subjects field) which is solvable, but better to wait and see how we will
// actually hande this issue in reality before
export const removeNullAndUnderscoreProperties = (values, formik) => {
  const newValues = _omitBy(
    values,
    (value, key) =>
      value === null ||
      (Array.isArray(value) && value.every((item) => item === null)) ||
      key.startsWith("_") ||
      key === "revision_id" ||
      key === "links" ||
      key === "updated" ||
      key === "created"
  );
  newValues.metadata = removeKeyFromNestedObjects(newValues.metadata);
  return newValues;
};
