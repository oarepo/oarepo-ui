import { useFormikContext } from "formik";
import React from "react";

// component to visualize formik state on screen during development

export const FormikStateLogger = () => {
  const state = useFormikContext();
  return <pre>{JSON.stringify(state, null, 2)}</pre>;
};
