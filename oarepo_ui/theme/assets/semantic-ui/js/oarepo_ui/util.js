import _map from "lodash/map";
import _reduce from "lodash/reduce";
import _omitBy from "lodash/omitBy";
import _isObject from "lodash/isObject";
import _isArray from "lodash/isArray";
import _forEach from "lodash/forEach";

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

// function that goes through an object and all its members and removes all the keys in the
// list of keys provided as argument from any object that lives inside the initial object,
//  even if it is inside of an array

function removeKeyFromNestedObjects(obj, keysToRemove) {
  for (let keyToRemove of keysToRemove) {
    console.log(keyToRemove);
    if (_isObject(obj)) {
      if (obj[keyToRemove] !== undefined) {
        delete obj[keyToRemove];
      }

      _forEach(obj, (value, key) => {
        if (_isObject(value) || _isArray(value)) {
          obj[key] = removeKeyFromNestedObjects(value, keysToRemove);
        }
      });
    } else if (_isArray(obj)) {
      _forEach(obj, (item, index) => {
        obj[index] = removeKeyFromNestedObjects(item, keysToRemove);
      });
    }
  }

  return obj;
}

// this function is a temporary solution for removing __key properties from arrayField items in formik's state
// before we submit. The function is kind of similar to the one in vocabularies, but also cannot be reused
// as vocabularies have only one arrayField and we keep the actual state with __key in _fieldName, which is deleted
// before submitting
// the problem with this implementation is if I have arrayFild within arrayField, it will not remove __key
// from internal arrayField (i.e. subjects field) which is solvable, but better to wait and see how we will
// actually hande this issue in reality before
export const removeNullAndInternalFields = (
  internalFieldsArray,
  keyToRemove
) => {
  return (values, formik) => {
    const newValues = _omitBy(
      values,
      (value, key) =>
        value === null ||
        (Array.isArray(value) && value.every((item) => item === null)) ||
        key.startsWith("_") ||
        internalFieldsArray.includes(key)
    );
    return removeKeyFromNestedObjects(newValues, keyToRemove);
  };
};
