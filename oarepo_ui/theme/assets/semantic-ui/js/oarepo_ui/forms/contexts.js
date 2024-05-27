import React from "react";

export const FormConfigContext = React.createContext();

export const FormConfigProvider = ({ children, value }) => {
  return (
    <FormConfigContext.Provider value={value}>
      {children}
    </FormConfigContext.Provider>
  );
};

export const FieldDataContext = React.createContext();

export const FieldDataProvider = ({ children, value }) => {
  return (
    <FieldDataContext.Provider value={value}>
      {children}
    </FieldDataContext.Provider>
  );
};
