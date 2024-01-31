import React from "react";
import { useFormikContext } from "formik";
import { Message } from "semantic-ui-react";
import PropTypes from "prop-types";

// component to visualize formik state on screen during development
export const FormikStateLogger = ({ render = false }) => {
  const state = useFormikContext();
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (render) {
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

FormikStateLogger.propTypes = {
  render: PropTypes.bool,
};

export default FormikStateLogger;
