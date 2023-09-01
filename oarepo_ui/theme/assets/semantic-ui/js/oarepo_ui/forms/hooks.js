import * as React from "react";
import { FormConfigContext } from "./contexts";
import { useMutation } from "@tanstack/react-query";
import { invokeCallbacks } from "./util";
import { save, _delete, publish } from "../api/actions";
import _isEmpty from "lodash/isEmpty";

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

  const onSubmit = async (values, formik) => {
    values = invokeCallbacks(onBeforeSubmit, values, formik);
    // for some reason when I set the submit context, even though I also conditionally set validation
    // schema, it seems that handleSubmit is still fired with previous (undefined) validation schema,
    // which causes FE validation to not do anything. So here I am calling form validation manually
    // and aborting the hook in case there are any errors, which works, but I am not a fan of this solution
    // it might be worth considering to just forget about FE validation like invenio does, because
    // with all these rerenders and contexts, it is not easy to guarantee the order in which things are
    // executed. Or if we have a better proposal it would be good.
    if (context === submitContextType.publish) {
      const errors = await formik.validateForm();
      if (!_isEmpty(errors)) return;
    }
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
      });
  };

  return { onSubmit, submitError };
};
