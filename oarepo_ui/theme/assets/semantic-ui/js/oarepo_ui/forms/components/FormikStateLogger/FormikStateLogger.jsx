import React from "react";
import { useFormikContext } from "formik";
import { Message } from "semantic-ui-react";

// component to visualize formik state on screen during development
export const FormikStateLogger = ({ target = "" }) => {
  const state = useFormikContext();
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (target === "dom") {
    return (
      <Message>
        <Message.Header>Current record state</Message.Header>
        <pre>{JSON.stringify(state.values, null, 2)}</pre>
      </Message>
    );
  }

  console.debug("[form state]: ", state, "\n[form values]:", state.values);
  return <></>;
};
