import _isArray from "lodash/isArray";
import _isBoolean from "lodash/isBoolean";
import _isEmpty from "lodash/isEmpty";
import _isNull from "lodash/isNull";
import _isNumber from "lodash/isNumber";
import _isObject from "lodash/isObject";
import _mapValues from "lodash/mapValues";
import _pickBy from "lodash/pickBy";
import _forEach from "lodash/forEach";
import _omitBy from "lodash/omitBy";

export class DepositRecordSerializer {
  constructor(defaultLocale) {
    if (this.constructor === DepositRecordSerializer) {
      throw new Error("Abstract");
    }
  }

  deserialize(record) {
    throw new Error("Not implemented.");
  }
  deserializeErrors(errors) {
    throw new Error("Not implemented.");
  }
  serialize(record) {
    throw new Error("Not implemented.");
  }
}

export class OARepoDepositSerializer extends DepositRecordSerializer {
  constructor(internalFieldsArray = [], keysToRemove = []) {
    super();
    this.internalFieldsArray = internalFieldsArray;
    this.keysToRemove = keysToRemove;
  }

  /**
   * Remove empty fields from record
   * @method
   * @param {object} obj - potentially empty object
   * @returns {object} record - without empty fields
   */
  removeEmptyValues = (obj) => {
    if (_isArray(obj)) {
      let mappedValues = obj.map((value) => this.removeEmptyValues(value));
      let filterValues = mappedValues.filter((value) => {
        if (_isBoolean(value) || _isNumber(value)) {
          return value;
        }
        return !_isEmpty(value);
      });
      return filterValues;
    } else if (_isObject(obj)) {
      let mappedValues = _mapValues(obj, (value) =>
        this.removeEmptyValues(value)
      );
      let pickedValues = _pickBy(mappedValues, (value, key) => {
        if (key === "metadata" && _isEmpty(value)) {
          return true;
        }
        if (_isArray(value) || _isObject(value)) {
          return !_isEmpty(value);
        }
        return !_isNull(value);
      });
      return pickedValues;
    }
    return _isNumber(obj) || _isBoolean(obj) || obj ? obj : null;
  };

  /**
   * Remove some specific key(s) from the values object i.e. __key that is introduced for invenio's fieldArray cmp
   * @method
   * @param {object} obj - that contains some arbitrarily nested key(s) you wish to remove
   * @returns {object} record - without those keys
   */

  removeKeysFromNestedObjects = (obj, keysToRemove) => {
    for (let keyToRemove of keysToRemove) {
      if (_isObject(obj)) {
        if (obj[keyToRemove] !== undefined) {
          delete obj[keyToRemove];
        }

        _forEach(obj, (value, key) => {
          if (_isObject(value) || _isArray(value)) {
            obj[key] = this.removeKeysFromNestedObjects(value, keysToRemove);
          }
        });
      } else if (_isArray(obj)) {
        _forEach(obj, (item, index) => {
          obj[index] = this.removeKeysFromNestedObjects(item, keysToRemove);
        });
      }
    }

    return obj;
  };

  /**
   * Remove null and some other top level fields (i.e. some errors that I want to temporarily store in Formik's state)
   * @method
   * @param {object} obj - obj with potentiall null values and some other top level keys I wish to remove
   * @returns {object} record - without null values or unwanted top level keys
   */
  removeNullAndInternalFields = (obj, internalFieldsArray) =>
    _omitBy(
      obj,
      (value, key) =>
        value === null ||
        (Array.isArray(value) && value.every((item) => item === null)) ||
        key.startsWith("_") ||
        internalFieldsArray.includes(key)
    );

  /**
   * Deserialize backend record into format compatible with frontend. We are not using deserialization yet. We are only currently serializing the record before sending
   * @method
   * @param {object} record - potentially empty object
   * @returns {object} frontend compatible record object
   */
  deserialize(record) {
    return record;
  }

  /**
   * Serialize record to send to the backend.
   * @method
   * @param {object} record - in frontend format
   * @returns {object} record - in API format
   *
   */
  serialize = (record) => {
    let serializedRecord = this.removeNullAndInternalFields(
      record,
      this.internalFieldsArray
    );

    serializedRecord = this.removeKeysFromNestedObjects(
      serializedRecord,
      this.keysToRemove
    );

    serializedRecord = this.removeEmptyValues(serializedRecord);

    return serializedRecord;
  };
}
