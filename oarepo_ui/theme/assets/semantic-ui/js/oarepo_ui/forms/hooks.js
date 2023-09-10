import * as React from "react";
import { FormConfigContext } from "./contexts";

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
