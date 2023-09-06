import React, { useMemo, useContext } from "react";
import { useFormikContext } from "formik";
import { useFormConfig } from "./hooks";
import { ApiClient, DepositActions } from "../api";
console.log(useFormConfig);

export const FormConfigContext = React.createContext();

export const FormConfigProvider = ({ children, value }) => {
  return (
    <FormConfigContext.Provider value={value}>
      {children}
    </FormConfigContext.Provider>
  );
};

export const ApiClientContext = React.createContext();

export const ApiClientProvider = ({
  children,
  clientClass = DepositActions,
}) => {
  const {
    formConfig: { createUrl },
  } = useFormConfig();
  // DefaultClass muze byt to OARepo.cosi..Client co ted mame
  const formik = useFormikContext();
  // initializing the low level api client with createUrl - the rest of URLs come from the record.links
  const OARepoFormActions = useMemo(() => {
    return new clientClass(new ApiClient(createUrl), formik);
  }, [createUrl, formik, clientClass]);
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
