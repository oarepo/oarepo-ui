import React, { useMemo, useCallback, useContext, useState } from "react";

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
  const [submitConfig, setSubmitConfig] = useState(undefined);

  const updateConfig = useCallback((newConfig) => {
    setSubmitConfig(newConfig);
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
