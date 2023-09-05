import * as React from "react";
import { FormConfigContext } from "./contexts";
import { useMutation } from "@tanstack/react-query";
import { invokeCallbacks } from "./util";
import { useFormikContext } from "formik";
import { useSubmitConfig } from "@js/oarepo_ui";
import { apiConfig } from "../api/apiConfig";
import { submitContextType } from "../api/submitContextTypes";
import { OArepoApiCaller } from "../api/api";

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

export const useOnSubmit = ({
  actionName,
  onBeforeSubmit = (values, formik) => values,
}) => {
  const { error: submitError, mutateAsync: submitAsync } = useMutation({
    mutationFn: async ({ data, formik }) => {
      let result;
      switch (actionName) {
        case submitContextType.save:
          result = await OArepoApiCaller.call(actionName, formik, data);
          break;
        case submitContextType.publish:
          result = await OArepoApiCaller.call(
            submitContextType.save,
            formik,
            data
          );
          if (result.errors) return;

          result = await OArepoApiCaller.call(actionName, formik, data, result);

          break;
        case submitContextType.preview:
          // TODO: don't have preview page yet
          break;
        case submitContextType.delete:
          result = await OArepoApiCaller.call(actionName, formik, data);
          break;
        default:
          throw new Error(`Unsupported submit context: ${actionName}`);
      }
      return result;
    },
  });

  const onSubmit = async (values, formik) => {
    values = invokeCallbacks(onBeforeSubmit, values, formik);
    submitAsync({
      data: values,
      formik,
    });
    // .then((result) => {
    //   formik.setSubmitting(false);
    //   invokeCallbacks(onSubmitSuccess, result, formik);
    // })
    // .catch((error) => {
    //   formik.setSubmitting(false);
    //   invokeCallbacks(onSubmitError, error, formik);
    // });
  };

  return { onSubmit, submitError };
};

export const useSubmitSupport = (actionName) => {
  const { updateConfig } = useSubmitConfig();
  const { handleSubmit, isSubmitting, setValues, values } = useFormikContext();
  const submit = () => {
    const callback = () => {
      updateConfig(apiConfig["save"]);
      setTimeout(handleSubmit, 0);
    };
    return callback;
  };
  return { submit, isSubmitting, setValues, values };
};
