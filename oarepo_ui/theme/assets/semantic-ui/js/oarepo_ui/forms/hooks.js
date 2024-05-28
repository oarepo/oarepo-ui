import { useEffect, useCallback, useState, useContext } from "react";
import { FormConfigContext } from "./contexts";
import {
  OARepoDepositApiClient,
  OARepoDepositSerializer,
  OARepoDepositFileApiClient,
} from "../api";
import _get from "lodash/get";
import _set from "lodash/set";
import { useFormikContext, getIn } from "formik";
import _omit from "lodash/omit";
import _pick from "lodash/pick";
import _isEmpty from "lodash/isEmpty";
import _isObject from "lodash/isObject";
import { i18next } from "@translations/oarepo_ui/i18next";
import { relativeUrl } from "../util";

export const extractFEErrorMessages = (obj) => {
  const errorMessages = [];

  const traverse = (obj, parentKey = "") => {
    if (typeof obj === "string") {
      errorMessages.push({ [parentKey]: obj });
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => traverse(item, `${parentKey}.${index}`));
    } else if (typeof obj === "object") {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = parentKey ? `${parentKey}.${key}` : key;
          traverse(obj[key], newKey);
        }
      }
    }
  };

  traverse(obj);

  // Deduplicate error messages based on the keys
  const uniqueErrorMessages = errorMessages.reduce((acc, obj) => {
    const key = Object.keys(obj)[0];
    const found = acc.some((item) => Object.keys(item)[0] === key);
    if (!found) acc.push(obj);
    return acc;
  }, []);
  return uniqueErrorMessages;
};

export const useFormConfig = () => {
  const context = useContext(FormConfigContext);
  if (!context) {
    throw new Error(
      "useFormConfig must be used inside FormConfigContext.Provider"
    );
  }
  return context;
};

export const useDefaultLocale = () => {
  const {
    formConfig: { default_locale },
  } = useFormConfig();

  return { defaultLocale: default_locale };
};

export const useVocabularyOptions = (vocabularyType) => {
  const {
    formConfig: { vocabularies },
  } = useFormConfig();

  return { options: vocabularies[vocabularyType] };
};

export const useConfirmationModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);

  return { isOpen, close, open };
};

export const useFormFieldValue = ({
  subValuesPath,
  defaultValue,
  subValuesUnique = true,
}) => {
  const usedSubValues = (value) =>
    value && typeof Array.isArray(value)
      ? value.map((val) => _get(val, "lang")) || []
      : [];
  const defaultNewValue = (initialVal, usedSubValues = []) =>
    _set(
      { ...initialVal },
      subValuesPath,
      !usedSubValues?.includes(defaultValue) || !subValuesUnique
        ? defaultValue
        : ""
    );

  return { usedSubValues, defaultNewValue };
};

export const useShowEmptyValue = (
  fieldPath,
  defaultNewValue,
  showEmptyValue
) => {
  const { values, setFieldValue } = useFormikContext();
  const currentFieldValue = getIn(values, fieldPath, []);
  useEffect(() => {
    if (!showEmptyValue) return;
    if (!_isEmpty(currentFieldValue)) return;
    if (defaultNewValue === undefined) {
      console.error(
        "Default value for new input must be provided. Field: ",
        fieldPath
      );
      return;
    }
    if (!fieldPath) {
      console.error("Fieldpath must be provided");
      return;
    }
    // to be used with invenio array fields that always push objects and add the __key property
    if (!_isEmpty(defaultNewValue) && _isObject(defaultNewValue)) {
      currentFieldValue.push({
        __key: currentFieldValue.length,
        ...defaultNewValue,
      });
      setFieldValue(fieldPath, currentFieldValue);
    } else if (typeof defaultNewValue === "string") {
      currentFieldValue.push(defaultNewValue);
      setFieldValue(fieldPath, currentFieldValue);
    }
  }, [showEmptyValue, setFieldValue, fieldPath, defaultNewValue]);
};

export const useDepositApiClient = ({
  baseApiClient,
  serializer,
  internalFieldsArray = [
    "errors",
    "BEvalidationErrors",
    "FEvalidationErrors",
    "httpErrors",
    "successMessage",
  ],
  keysToRemove = ["__key"],
} = {}) => {
  const formik = useFormikContext();

  const {
    isSubmitting,
    values,
    validateForm,
    setSubmitting,
    setValues,
    setFieldError,
    setFieldValue,
    setErrors,
  } = formik;
  const {
    formConfig: { createUrl },
  } = useFormConfig();

  const recordSerializer = serializer
    ? new serializer(internalFieldsArray, keysToRemove)
    : new OARepoDepositSerializer(internalFieldsArray, keysToRemove);

  const apiClient = baseApiClient
    ? new baseApiClient(createUrl, recordSerializer)
    : new OARepoDepositApiClient(createUrl, recordSerializer);

  async function save(saveWithoutDisplayingValidationErrors = false) {
    let response;

    setSubmitting(true);
    //  purge any existing errors in internal fields before making save action
    const valuesWithoutInternalFields = _omit(values, internalFieldsArray);
    setErrors({});
    try {
      response = await apiClient.saveOrCreateDraft(valuesWithoutInternalFields);
      // when I am creating a new draft, it saves the response into formik's state, so that I would have access
      // to the draft and draft links in the app. I we don't do that then each time I click on save it will
      // create new draft, as I don't actually refresh the page, so the record from html is still empty. Invenio,
      // solves this by keeping record in the store, but the idea here is to not create some central state,
      // but use formik as some sort of auxiliary state.

      if (!valuesWithoutInternalFields.id) {
        window.history.replaceState(
          undefined,
          "",
          relativeUrl(response.links.edit_html)
        );
      }

      // it is a little bit problematic that when you save with errors, the server does not actually return in the response
      // the value you filled if it resulted in validation error. It can cause discrepancy between what is shown in the form and actual
      // state in formik so we preserve metadata in this way
      setValues({
        ..._omit(response, ["metadata"]),
        ..._pick(values, ["metadata"]),
      });

      // save accepts posts/puts even with validation errors. Here I check if there are some errors in the response
      // body. Here I am setting the individual error messages to the field
      if (!saveWithoutDisplayingValidationErrors && response.errors) {
        response.errors.forEach((error) =>
          setFieldError(error.field, error.messages[0])
        );
        // here I am setting the state to be used by FormFeedback componene that plugs into the formik's context.
        setFieldValue("BEvalidationErrors", {
          errors: response.errors,
          errorMessage: i18next.t(
            "Draft saved with validation errors. Fields listed below that failed validation were not saved to the server"
          ),
        });
        return false;
      }
      if (!saveWithoutDisplayingValidationErrors)
        setFieldValue("successMessage", i18next.t("Draft saved successfully."));
      return response;
    } catch (error) {
      // handle 400 errors. Normally, axios would put messages in error.response. But for example
      // offline Error message does not produce a response, so in this way we can display
      // network error message
      setFieldValue(
        "httpErrors",
        error?.response?.data?.message ?? error.message
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function publish() {
    // call save and if save returns false, exit
    const saveResult = await save();

    if (!saveResult) {
      setFieldValue(
        "BEvalidationErrors.errorMessage",
        i18next.t(
          "Draft was saved but could not be published due to following validation errors"
        )
      );
      return;
    }
    // imperative form validation, if fails exit
    const FEvalidationErrors = await validateForm();
    // show also front end validation errors grouped on the top similar to BE validation errors for consistency
    if (!_isEmpty(FEvalidationErrors)) {
      setFieldValue("FEvalidationErrors", {
        errors: extractFEErrorMessages(FEvalidationErrors.metadata),
        errorMessage: i18next.t(
          "Draft was saved but could not be published due to following validation errors"
        ),
      });
      return;
    }
    setSubmitting(true);
    let response;
    try {
      response = await apiClient.publishDraft(saveResult);
      // to remove edit url from the history so when you click back you are taken to the main page instead
      // of the page throwin error as the record is already published. TODO: maybe should be search_html that
      // takes to main search app
      window.history.replaceState(null, "", "/");
      window.location.href = response.links.self_html;
      setFieldValue(
        "successMessage",
        i18next.t(
          "Draft published successfully. Redirecting to record's detail page ..."
        )
      );

      return response;
    } catch (error) {
      // in case of validation errors on the server during publish, in RDM they return a 400 and below
      // error message. Not 100% sure if our server does the same.
      if (
        error?.response &&
        error.response.data?.status === 400 &&
        error.response.data?.message === "A validation error occurred."
      ) {
        error.errors?.forEach((err) =>
          setFieldError(err.field, err.messages.join(" "))
        );
      } else {
        setFieldValue(
          "httpErrors",
          error?.response?.data?.message ?? error.message
        );
      }

      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function read(recordUrl) {
    return await apiClient.readDraft({ self: recordUrl });
  }

  async function _delete(redirectUrl) {
    if (!redirectUrl)
      throw new Error(
        "You must provide url where to be redirected after deleting a draft"
      );
    setSubmitting(true);
    try {
      let response = await apiClient.deleteDraft(values);

      window.location.href = redirectUrl;
      setFieldValue(
        "successMessage",
        i18next.t(
          "Draft deleted successfully. Redirecting to the main page ..."
        )
      );
      return response;
    } catch (error) {
      setFieldValue(
        "httpErrors",
        error?.response?.data?.message ?? error.message
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function preview() {
    setSubmitting(true);
    try {
      const saveResult = await save();

      if (!saveResult) {
        setFieldValue(
          "BEvalidationErrors.errorMessage",
          i18next.t(
            "Your draft was saved. If you wish to preview it, please correct the following validation errors and click preview again:"
          )
        );
        return;
      } else {
        const url = saveResult.links.self_html;
        setFieldValue(
          "successMessage",
          i18next.t("Your draft was saved. Redirecting to the preview page...")
        );
        setTimeout(() => {
          setFieldValue("successMessage", "");
          window.location.href = url;
        }, 1000);
      }
      return saveResult;
    } catch (error) {
      setFieldValue(
        "httpErrors",
        error?.response?.data?.message ?? error.message
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }
  // we return also recordSerializer and apiClient instances, if someone wants to use this hook
  // inside of another hook, they don't have to initialize the instances manually
  return {
    values,
    isSubmitting,
    save,
    publish,
    read,
    _delete,
    preview,
    recordSerializer,
    apiClient,
    createUrl,
    formik,
  };
};

export const useDepositFileApiClient = (baseApiClient) => {
  const formik = useFormikContext();

  const { isSubmitting, values, setFieldValue, setSubmitting, setValues } =
    formik;

  const apiClient = baseApiClient
    ? new baseApiClient()
    : new OARepoDepositFileApiClient();

  async function read(draft) {
    return await apiClient.readDraftFiles(draft);
  }
  async function _delete(file) {
    setValues(
      _omit(values, [
        "errors",
        "BEvalidationErrors",
        "FEvalidationErrors",
        "httpErrors",
        "successMessage",
      ])
    );
    setSubmitting(true);
    try {
      let response = await apiClient.deleteFile(file?.links);
      return Promise.resolve(response);
    } catch (error) {
      setFieldValue(
        "httpErrors",
        error?.response?.data?.message ?? error.message
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }
  return {
    values,
    isSubmitting,
    _delete,
    read,
    apiClient,
    formik,
    setFieldValue,
  };
};

export const handleValidateAndBlur = (validateField, setFieldTouched) => {
  return (fieldPath) => {
    setFieldTouched(fieldPath, true);
    validateField(fieldPath);
  };
};

export const useValidateOnBlur = () => {
  const { validateField, setFieldTouched } = useFormikContext();

  return handleValidateAndBlur(validateField, setFieldTouched);
};
