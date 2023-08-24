import * as React from "react";
import { FormConfigContext } from "./contexts";
import { useMutation } from "@tanstack/react-query";
import { OARepoDepositApiClient } from "../api/client";
import { invokeCallbacks } from "./util";

export const useFormConfig = () => {
  const context = React.useContext(FormConfigContext);
  if (!context) {
    throw new Error(
      "useFormConfig must be used inside FormConfigContext.Provider"
    );
  }
  return context;
};

export const useVocabularyOptions = (vocabularyType) => {
  const {
    formConfig: { vocabularies },
  } = useFormConfig();

  return { options: vocabularies[vocabularyType] };
};

export const submitContextType = {
  create: "create",
  update: "update",
  preview: "preview",
};

export const useOnSubmit = ({
  apiUrl,
  context = submitContextType.create,
  apiClient = OARepoDepositApiClient,
  onBeforeSubmit = (values, formik) => values,
  onSubmitSuccess = () => {},
  onSubmitError = () => {},
}) => {
  const { error: submitError, mutateAsync: submitAsync } = useMutation({
    mutationFn: async ({ apiUrl, data }) => {
      let result;
      switch (context) {
        case submitContextType.create:
          result = await apiClient.createDraft(apiUrl, data);
          break;
        case submitContextType.update:
          result = await apiClient.saveDraft(apiUrl, data);
          break;
        case submitContextType.preview:
          break;
        default:
          throw new Error(`Unsupported submit context: ${context}`);
      }
      return result;
    },
  });

  const onSubmit = (values, formik) => {
    values = invokeCallbacks(onBeforeSubmit, values, formik);
    submitAsync({
      apiUrl,
      data: values,
    })
      .then((result) => {
        formik.setSubmitting(false);
        invokeCallbacks(onSubmitSuccess, result, formik);
      })
      .catch((error) => {
        formik.setSubmitting(false);
        invokeCallbacks(onSubmitError, error, formik);
      });
  };

  return { onSubmit, submitError };
};
