import React, { createContext, useMemo } from "react";
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
  const {
    config: { ui_model: uiModel },
  } = useFormConfig();

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
