import React from "react";
import { Message } from "semantic-ui-react";
import { useFormikContext, getIn } from "formik";
import _isEmpty from "lodash/isEmpty";
import _startCase from "lodash/startCase";
import _cloneDeep from "lodash/cloneDeep";
import _omit from "lodash/omit";

// component to be used downstream of Formik that plugs into Formik's state and displays any errors
// that apiClient sent to formik in auxilary keys. The keys are later removed when submitting the form

// function to turn last part of fieldPath from form camelCase to Camel Case
const titleCase = (fieldPath) =>
  _startCase(fieldPath.split(".")[fieldPath.split(".").length - 1]);

const CustomMessage = ({ children, ...uiProps }) => {
  const { values, setValues } = useFormikContext();
  const formikValuesCopy = _cloneDeep(values);
  const handleDismiss = () => {
    const valuesWithoutInternalErrorFields = _omit(formikValuesCopy, [
      "BEvalidationErrors",
      "FEvalidationErrors",
      "httpErrors",
      "successMessage",
    ]);
    setValues(valuesWithoutInternalErrorFields);
  };
  return (
    <Message onDismiss={handleDismiss} className="rel-mb-2" {...uiProps}>
      {children}
    </Message>
  );
};
export const FormFeedback = () => {
  const { values } = useFormikContext();
  const beValidationErrors = getIn(values, "BEvalidationErrors", {});
  const feValidationErrors = getIn(values, "FEvalidationErrors", {});
  let httpError = getIn(values, "httpErrors", "");
  if (httpError?.response?.data) {
    httpError = httpError?.response?.data.message;
  }
  const successMessage = getIn(values, "successMessage", "");

  if (!_isEmpty(beValidationErrors))
    return (
      <CustomMessage negative color="orange">
        <Message.Header>{beValidationErrors?.errorMessage}</Message.Header>
        <Message.List>
          {beValidationErrors?.errors?.map((error, index) => (
            <Message.Item key={`${error.field}-${index}`}>{`${titleCase(
              error.field
            )}: ${error.messages[0]}`}</Message.Item>
          ))}
        </Message.List>
      </CustomMessage>
    );
  if (!_isEmpty(feValidationErrors))
    return (
      <CustomMessage negative color="orange">
        <Message.Header>{feValidationErrors?.errorMessage}</Message.Header>
        <Message.List>
          {feValidationErrors?.errors?.map((error, index) => (
            <Message.Item key={`${error.field}-${index}`}>{error}</Message.Item>
          ))}
        </Message.List>
      </CustomMessage>
    );
  if (httpError)
    return (
      <CustomMessage negative color="orange">
        <Message.Header>{httpError}</Message.Header>
      </CustomMessage>
    );
  if (successMessage)
    return (
      <CustomMessage positive color="green">
        <Message.Header>{successMessage}</Message.Header>
      </CustomMessage>
    );
  return null;
};
