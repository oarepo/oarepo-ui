import React, { createContext, useMemo, useRef } from "react";
import { getFieldData } from "./util";
import { useFormConfig } from "./hooks";
import PropTypes from "prop-types";

export const FormConfigContext = createContext();

export const FormConfigProvider = ({ children = null, value }) => {
  return (
    <FormConfigContext.Provider value={value}>
      {children}
    </FormConfigContext.Provider>
  );
};

FormConfigProvider.propTypes = {
  value: PropTypes.object.isRequired,
  // eslint-disable-next-line react/require-default-props
  children: PropTypes.node,
};

export const FieldDataContext = createContext();

export const FieldDataProvider = ({
  children = null,
  fieldPathPrefix = "",
}) => {
  const { ui_model: uiModel } = useFormConfig();

  const fieldDataValue = useMemo(
    () => ({ getFieldData: getFieldData(uiModel, fieldPathPrefix) }),
    [uiModel, fieldPathPrefix]
  );

  return (
    <FieldDataContext.Provider value={fieldDataValue}>
      {children}
    </FieldDataContext.Provider>
  );
};

FieldDataProvider.propTypes = {
  // eslint-disable-next-line react/require-default-props
  children: PropTypes.node,
  // eslint-disable-next-line react/require-default-props
  fieldPathPrefix: PropTypes.string,
};

export const FormikRefContext = createContext();

export const FormikRefProvider = ({ children = null }) => {
  const formikRef = useRef(null);
  return (
    <FormikRefContext.Provider value={formikRef}>
      {children}
    </FormikRefContext.Provider>
  );
};

FormikRefProvider.propTypes = {
  // eslint-disable-next-line react/require-default-props
  children: PropTypes.node,
};
