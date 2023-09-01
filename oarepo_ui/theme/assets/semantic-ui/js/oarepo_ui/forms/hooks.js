import * as React from "react";
import { FormConfigContext } from "./contexts";
import { useMutation } from "@tanstack/react-query";
import { invokeCallbacks } from "./util";
import { save, _delete, publish } from "../api/actions";
import { useSubmitConfig } from "@js/oarepo_ui";

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
  save: "save",
  publish: "publish",
  preview: "preview",
  delete: "delete",
};

export const useOnSubmit = ({
  context = undefined,
  onBeforeSubmit = (values, formik) => values,
  onSubmitSuccess = () => {},
  onSubmitError = () => {},
}) => {
  const {
    formConfig: { createUrl },
  } = useFormConfig();
  const { updateConfig } = useSubmitConfig();
  const { error: submitError, mutateAsync: submitAsync } = useMutation({
    mutationFn: async ({ data }) => {
      let result;
      switch (context) {
        case submitContextType.save:
          result = await save(data, createUrl);
          break;
        case submitContextType.publish:
          result = await publish(data, createUrl);
          break;
        case submitContextType.preview:
          // TODO: don't have preview page yet
          break;
        case submitContextType.delete:
          await _delete(data);
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
      data: values,
    })
      .then((result) => {
        formik.setSubmitting(false);
        invokeCallbacks(onSubmitSuccess, result, formik);
      })
      .catch((error) => {
        formik.setSubmitting(false);
        invokeCallbacks(onSubmitError, error, formik);
      })
      .finally(updateConfig({ contenxt: undefined }));
  };

  return { onSubmit, submitError };
};
