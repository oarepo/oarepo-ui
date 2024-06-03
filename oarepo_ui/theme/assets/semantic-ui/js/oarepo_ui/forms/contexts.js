import React, { useContext } from "react";
import { getFieldData, useFormConfig } from "@js/oarepo_ui";

export const FormConfigContext = React.createContext();

export const FormConfigProvider = ({ children, value }) => {
  return (
    <FormConfigContext.Provider value={value}>
      {children}
    </FormConfigContext.Provider>
  );
};

export const FieldDataContext = React.createContext();

export const FieldDataProvider = ({ children, fieldPathPrefix = "" }) => {
  const {
    formConfig: { ui_model },
  } = useFormConfig();
  return (
    <FieldDataContext.Provider
      value={{ getFieldData: getFieldData(ui_model, fieldPathPrefix) }}
    >
      {children}
    </FieldDataContext.Provider>
  );
};
