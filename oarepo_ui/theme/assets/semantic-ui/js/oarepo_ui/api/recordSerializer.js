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
import _set from "lodash/set";
import _pick from "lodash/pick";
import _cloneDeep from "lodash/cloneDeep";
import { RDMDepositRecordSerializer } from "@js/invenio_rdm_records/src/deposit/api/DepositRecordSerializer";

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

export class OARepoDepositSerializer extends RDMDepositRecordSerializer {
  constructor(internalFieldsArray = [], keysToRemove = ["__key"]) {
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
  // removeEmptyValues = (obj) => {
  //   if (_isArray(obj)) {
  //     let mappedValues = obj.map((value) => this.removeEmptyValues(value));
  //     let filterValues = mappedValues.filter((value) => {
  //       if (_isBoolean(value) || _isNumber(value)) {
  //         return value;
  //       }
  //       return !_isEmpty(value);
  //     });
  //     return filterValues;
  //   } else if (_isObject(obj)) {
  //     let mappedValues = _mapValues(obj, (value) =>
  //       this.removeEmptyValues(value)
  //     );
  //     let pickedValues = _pickBy(mappedValues, (value, key) => {
  //       if (key === "metadata" && _isEmpty(value)) {
  //         return true;
  //       }
  //       if (_isArray(value) || _isObject(value)) {
  //         return !_isEmpty(value);
  //       }
  //       return !_isNull(value);
  //     });
  //     return pickedValues;
  //   }
  //   return _isNumber(obj) || _isBoolean(obj) || obj ? obj : null;
  // };

  // /**
  //  * Remove some specific key(s) from the values object i.e. __key that is introduced for invenio's fieldArray cmp
  //  * @method
  //  * @param {object} obj - that contains some arbitrarily nested key(s) you wish to remove
  //  * @returns {object} record - without those keys
  //  */

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

  // /**
  //  * Remove null and some other top level fields (i.e. some errors that I want to temporarily store in Formik's state)
  //  * @method
  //  * @param {object} obj - obj with potentiall null values and some other top level keys I wish to remove
  //  * @returns {object} record - without null values or unwanted top level keys
  //  */
  // removeNullAndInternalFields = (obj, internalFieldsArray) =>
  //   _omitBy(
  //     obj,
  //     (value, key) =>
  //       value === null ||
  //       (Array.isArray(value) && value.every((item) => item === null)) ||
  //       key.startsWith("_") ||
  //       internalFieldsArray.includes(key)
  //   );

  /**
   * Deserialize backend record into format compatible with frontend. We are not using deserialization yet. We are only currently serializing the record before sending
   * @method
   * @param {object} record - potentially empty object
   * @returns {object} frontend compatible record object
   */
  deserialize(record) {
    // NOTE: cloning now allows us to manipulate the copy with impunity
    //       without affecting the original
    const originalRecord = _pick(_cloneDeep(record), [
      "access",
      "expanded",
      "metadata",
      "id",
      "links",
      "files",
      "media_files",
      "is_published",
      "versions",
      "parent",
      "status",
      "pids",
      "ui",
      "custom_fields",
      "created",
      "updated",
      "revision_id",
    ]);

    // FIXME: move logic in a more sophisticated PIDField that allows empty values
    // to be sent in the backend
    const savedPIDsFieldValue = originalRecord.pids || {};

    // Remove empty null values from record. This happens when we create a new
    // draft and the backend produces an empty record filled in with null
    // values, array of null values etc.
    // TODO: Backend should not attempt to provide empty values. It should just
    //       return existing record in case of edit or {} in case of new.
    // let deserializedRecord = this._removeEmptyValues(originalRecord);

    // FIXME: Add back pids field in case it was removed
    let deserializedRecord = {
      ...originalRecord,
      ...(!_isEmpty(savedPIDsFieldValue) ? { pids: savedPIDsFieldValue } : {}),
    };

    for (const key in this.depositRecordSchema) {
      deserializedRecord = this.depositRecordSchema[key].deserialize(
        deserializedRecord,
        this.defaultLocale
      );
    }
    return deserializedRecord;
  }

  /**
   * Serialize record to send to the backend.
   * @method
   * @param {object} record - in frontend format
   * @returns {object} record - in API format
   *
   */
  serialize = (record) => {
    let serializedRecord = this.removeKeysFromNestedObjects(
      record,
      this.keysToRemove
    );
    serializedRecord = super.serialize(record);

    return serializedRecord;
  };

  deserializeErrors(errors) {
    let deserializedErrors = {};
    // TODO - WARNING: This doesn't convert backend error paths to frontend
    //                 error paths. Doing so is non-trivial
    //                 (re-using deserialize has some caveats)
    //                 Form/Error UX is tackled in next sprint and this is good
    //                 enough for now.
    for (const e of errors) {
      if ("severity" in e) {
        // New error format with severity and description
        _set(deserializedErrors, e.field, {
          message: e.messages.join(" "),
          severity: e.severity, // severity level of the error
          description: e.description, // additional information about the rule that generated the error
        });
      } else {
        // Backward compatibility with old error format, including just the error string
        _set(deserializedErrors, e.field, e.messages.join(" "));
      }
    }

    return deserializedErrors;
  }
}
