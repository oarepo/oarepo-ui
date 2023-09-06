import React, { useMemo, useCallback, useContext, useState } from "react";

export const FormConfigContext = React.createContext();

export const FormConfigProvider = ({ children, value }) => {
  return (
    <FormConfigContext.Provider value={value}>
      {children}
    </FormConfigContext.Provider>
  );
};

export const ActionNameContext = React.createContext();

export const ActionNameProvider = ({ children }) => {
  const [actionName, setActionName] = useState(undefined);

  const updateActionName = useCallback((newConfig) => {
    setActionName(newConfig);
  }, []);

  const contextValue = useMemo(
    () => ({ actionName, updateActionName }),
    [actionName, updateActionName]
  );

  return (
    <ActionNameContext.Provider value={contextValue}>
      {children}
    </ActionNameContext.Provider>
  );
};

export const useActionName = () => {
  const context = useContext(ActionNameContext);
  if (!context) {
    throw new Error(
      "useSubmitConfig must be used inside ActionNameContext.Provider"
    );
  }
  return context;
};
