import { useFormikContext } from "formik";
import React from "react";

// component to visualize formik state on screen during development

export const FormikStateLogger = () => {
  const state = useFormikContext();

  console.debug("[form state]: ", state, "\n[form values]:", state.values);

  return <></>
};
