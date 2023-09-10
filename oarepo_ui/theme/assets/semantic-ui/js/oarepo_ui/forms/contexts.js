import React, { useMemo, useContext } from "react";
import { useFormikContext } from "formik";
import { useFormConfig } from "./hooks";
import {
  OARepoDepositApiClient,
  DepositActions,
  OARepoDepositSerializer,
} from "../api";

export const FormConfigContext = React.createContext();

export const FormConfigProvider = ({ children, value }) => {
  return (
    <FormConfigContext.Provider value={value}>
      {children}
    </FormConfigContext.Provider>
  );
};

// TODO: fix links in low level API client
// create a serializer Class for cleanup. Pass the record through deserializer when it arrives from HTML
// when making CRUD when sending, serialize the record, when recieving response, deserialize record
// test how all of this would work in vocabularies
//
export const ApiClientContext = React.createContext();
// TODO: maybe try useReducer?
export const ApiClientProvider = ({
  children,
  clientClass = DepositActions,
  baseClientClass = OARepoDepositApiClient,
  recordSerializer = new OARepoDepositSerializer(
    ["errors", "validationErrors", "httpErrors", "successMessage"],
    ["__key"]
  ),
}) => {
  const {
    formConfig: { createUrl },
  } = useFormConfig();
  const formik = useFormikContext();

  const initializedBaseClientClass = useMemo(() => {
    return new baseClientClass(createUrl, recordSerializer);
  }, [createUrl, baseClientClass, recordSerializer]);
  const OARepoFormActions = useMemo(() => {
    return new clientClass(initializedBaseClientClass, formik);
  }, [formik, clientClass, initializedBaseClientClass]);
  return (
    <ApiClientContext.Provider value={OARepoFormActions}>
      {children}
    </ApiClientContext.Provider>
  );
};

export const useApiClient = () => {
  const context = useContext(ApiClientContext);
  if (!context) {
    throw new Error(
      "useApiClient must be used inside ApiClientContext.Provider"
    );
  }
  return context;
};
