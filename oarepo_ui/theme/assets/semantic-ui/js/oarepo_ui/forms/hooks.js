import * as React from "react";
import { FormConfigContext } from "./contexts";
import { useMutation } from "@tanstack/react-query";
import { invokeCallbacks } from "./util";
import { useFormikContext } from "formik";
import { useActionName } from "@js/oarepo_ui";
import { submitContextType } from "../api/submitContextTypes";
import { OARepoFormActions } from "../api/depositActions";

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
          result = await OARepoFormActions.call(actionName, formik, data);
          break;
        case submitContextType.publish:
          result = await OARepoFormActions.call(
            submitContextType.save,
            formik,
            data
          );
          if (result.errors) return;
          result = await OARepoFormActions.call(
            actionName,
            formik,
            data,
            result
          );
          break;
        case submitContextType.preview:
          // TODO: don't have preview page yet
          break;
        case submitContextType.delete:
          result = await OARepoFormActions.call(actionName, formik, data);
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

// hook to be used inside of biut
export const useSubmitSupport = (actionName) => {
  const { updateActionName } = useActionName();
  const { handleSubmit, isSubmitting, setValues, values } = useFormikContext();
  const submit = () => {
    updateActionName(submitContextType[actionName]);
    // hacky way to make sure that updateActionName has finished before firing handle submit
    setTimeout(handleSubmit, 0);
  };
  return { submit, isSubmitting, setValues, values };
};
