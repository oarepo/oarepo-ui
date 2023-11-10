import * as React from "react";
import { FormConfigContext } from "./contexts";
import { OARepoDepositApiClient, OARepoDepositSerializer } from "../api";
import { useFormikContext } from "formik";
import _get from "lodash/get";
import _set from "lodash/set";
import _omit from "lodash/omit";
import _pick from "lodash/pick";
import _isEmpty from "lodash/isEmpty";
import { i18next } from "@translations/oarepo_ui/i18next";
import { relativeUrl } from "../util";

export const useFormConfig = () => {
  const context = React.useContext(FormConfigContext);
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

  return { defaultLocale: default_locale }
}

export const useVocabularyOptions = (vocabularyType) => {
  const {
    formConfig: { vocabularies },
  } = useFormConfig();

  return { options: vocabularies[vocabularyType] };
};

export const useConfirmationModal = () => {
  const [isModalOpen, setIsModalOopen] = React.useState(false);

  const handleCloseModal = () => setIsModalOopen(false);
  const handleOpenModal = () => setIsModalOopen(true);

  return { isModalOpen, handleCloseModal, handleOpenModal };
};

export const useFormFieldValue = ({ fieldPath, subValuesPath, defaultValue, subValuesUnique = true }) => {
  const usedSubValues = (value) =>
    value && typeof Array.isArray(value)
      ? value.map((val) => _get(val, "lang")) || []
      : [];
  const defaultNewValue = (initialVal, usedSubValues = []) => _set({ ...initialVal }, subValuesPath, !usedSubValues?.includes(defaultValue) || !subValuesUnique ? defaultValue : "")

  return { usedSubValues, defaultNewValue }
}

export const useDepositApiClient = (
  baseApiClient,
  serializer,
  internalFieldsArray = [
    "errors",
    "validationErrors",
    "httpErrors",
    "successMessage",
  ],
  keysToRemove = ["__key"]
) => {
  const formik = useFormikContext();

  const {
    isSubmitting,
    values,
    validateForm,
    setErrors,
    setSubmitting,
    setValues,
    setFieldError,
    setFieldValue,
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

  async function save () {
    let response;

    setSubmitting(true);
    setErrors({});
    try {
      response = await apiClient.saveOrCreateDraft(values);
      // when I am creating a new draft, it saves the response into formik's state, so that I would have access
      // to the draft and draft links in the app. I we don't do that then each time I click on save it will
      // create new draft, as I don't actually refresh the page, so the record from html is still empty. Invenio,
      // solves this by keeping record in the store, but the idea here is to not create some central state,
      // but use formik as some sort of auxiliary state.

      if (!values.id) {
        window.history.replaceState(
          undefined,
          "",
          relativeUrl(response.links.self_html)
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
      if (response.errors) {
        response.errors.forEach((error) =>
          setFieldError(error.field, error.messages[0])
        );
        // here I am setting the state to be used by FormFeedback componene that plugs into the formik's context.
        setFieldValue("validationErrors", {
          errors: response.errors,
          errorMessage: i18next.t(
            "Draft saved with validation errors. Fields listed below that failed validation were not saved to the server"
          ),
        });
        return false;
      }
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

  async function publish () {
    // call save and if save returns false, exit
    const saveResult = await save();
    if (!saveResult) return;
    // imperative form validation, if fails exit
    const validationErrors = await validateForm();
    if (!_isEmpty(validationErrors)) return;
    setSubmitting(true);
    let response;
    try {
      response = await apiClient.publishDraft(saveResult);

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

  async function read (recordUrl) {
    return await apiClient.readDraft({ self: recordUrl });
  }

  async function _delete (redirectUrl) {
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
  // we return also recordSerializer and apiClient instances, if someone wants to use this hook
  // inside of another hook, they don't have to initialize the instances manually
  return {
    values,
    isSubmitting,
    save,
    publish,
    read,
    _delete,
    recordSerializer,
    apiClient,
    createUrl,
    formik,
  };
};
