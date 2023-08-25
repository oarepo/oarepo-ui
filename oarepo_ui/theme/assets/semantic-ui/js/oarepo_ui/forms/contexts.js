import React, { useMemo, useCallback, useContext, useState } from "react";
import { removeNullAndInternalFields } from "../util";

export const FormConfigContext = React.createContext();

export const FormConfigProvider = ({ children, value }) => {
  return (
    <FormConfigContext.Provider value={value}>
      {children}
    </FormConfigContext.Provider>
  );
};

export const SubmitConfigContext = React.createContext();

export const SubmitConfigProvider = ({ children }) => {
  const defaultConfig = {
    onBeforeSubmit: removeNullAndInternalFields([], ["__key"]),
    onSubmitError: (error, formik) => {
      if (
        error &&
        error.status === 400 &&
        error.message === "A validation error occurred."
      ) {
        error.errors?.forEach((err) =>
          formik.setFieldError(err.field, err.messages.join(" "))
        );
      }
    },
  };
  const [submitConfig, setSubmitConfig] = useState(defaultConfig);

  const updateConfig = useCallback((newConfig) => {
    setSubmitConfig(() => ({
      ...defaultConfig,
      ...newConfig,
    }));
  }, []);

  const contextValue = useMemo(
    () => ({ submitConfig, updateConfig }),
    [submitConfig, updateConfig]
  );

  return (
    <SubmitConfigContext.Provider value={contextValue}>
      {children}
    </SubmitConfigContext.Provider>
  );
};

export const useSubmitConfig = () => {
  const context = useContext(SubmitConfigContext);
  if (!context) {
    throw new Error(
      "useSubmitConfig must be used inside SubmitConfigContext.Provider"
    );
  }
  return context;
};
