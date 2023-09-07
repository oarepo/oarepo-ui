import * as React from "react";
import { FormConfigContext } from "./contexts";
import { useMutation } from "@tanstack/react-query";
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

export const useOnSubmit = ({
  actionName,
  onBeforeSubmit = (values, formik) => values,
}) => {
  const { error: submitError, mutateAsync: submitAsync } = useMutation({
    mutationFn: async ({ data, formik }) => {
      let result;
      // switch (actionName) {
      //   case submitContextType.save:
      //     result = await OARepoFormActions.call(actionName, formik, data);
      //     break;
      //   case submitContextType.publish:
      //     result = await OARepoFormActions.call(
      //       submitContextType.save,
      //       formik,
      //       data
      //     );
      //     if (result.errors) return;
      //     result = await OARepoFormActions.call(
      //       actionName,
      //       formik,
      //       data,
      //       result
      //     );
      //     break;
      //   case submitContextType.preview:
      //     // TODO: don't have preview page yet
      //     break;
      //   case submitContextType.delete:
      //     result = await OARepoFormActions.call(actionName, formik, data);
      //     break;
      //   default:
      //     throw new Error(`Unsupported submit context: ${actionName}`);
      // }
      return result;
    },
  });

  const onSubmit = async (values, formik) => {
    values = invokeCallbacks(onBeforeSubmit, values, formik);
    submitAsync({
      data: values,
      formik,
    });
  };

  return { onSubmit, submitError };
};

// hook that enables me to highlight the related inputs when I hover over the close buttons
// for arrayFields type of inputs
export const useHighlightState = () => {
  const [highlightedStates, setHighlightedStates] = React.useState([]);

  const handleHover = (index) => {
    const updatedStates = [...highlightedStates];
    updatedStates[index] = true;
    setHighlightedStates(updatedStates);
  };

  const handleMouseLeave = (index) => {
    const updatedStates = [...highlightedStates];
    updatedStates[index] = false;
    setHighlightedStates(updatedStates);
  };

  return { highlightedStates, handleHover, handleMouseLeave };
};

export const useConfirmationModal = () => {
  const [isModalOpen, setIsModalOopen] = React.useState(false);

  const handleCloseModal = () => setIsModalOopen(false);
  const handleOpenModal = () => setIsModalOopen(true);

  return { isModalOpen, handleCloseModal, handleOpenModal };
};

export const submitContextType = {
  save: "save",
  publish: "publish",
  preview: "preview",
  delete: "delete",
};
