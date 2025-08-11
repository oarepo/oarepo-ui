import React, { createContext, useMemo, useRef } from "react";
import { getFieldData, useFormConfig } from "@js/oarepo_ui";
import PropTypes from "prop-types";

export const FormConfigContext = createContext();

export const FormConfigProvider = ({ children, value }) => {
  return (
    <FormConfigContext.Provider value={value}>
      {children}
    </FormConfigContext.Provider>
  );
};

FormConfigProvider.propTypes = {
  value: PropTypes.object.isRequired,
  children: PropTypes.node,
};

export const FieldDataContext = createContext();

export const FieldDataProvider = ({ children, fieldPathPrefix = "" }) => {
  const { ui_model } = useFormConfig();

  const fieldDataValue = useMemo(
    () => ({ getFieldData: getFieldData(ui_model, fieldPathPrefix) }),
    [ui_model, fieldPathPrefix]
  );

  return (
    <FieldDataContext.Provider value={fieldDataValue}>
      {children}
    </FieldDataContext.Provider>
  );
};

FieldDataProvider.propTypes = {
  children: PropTypes.node,
  fieldPathPrefix: PropTypes.string,
};

export const FormikRefContext = createContext();

export const FormikRefProvider = ({ children }) => {
  const formikRef = useRef(null);
  return (
    <FormikRefContext.Provider value={formikRef}>
      {children}
    </FormikRefContext.Provider>
  );
};

FormikRefProvider.propTypes = {
  children: PropTypes.node,
};
