import React from "react";
import { Message } from "semantic-ui-react";
import { useFormikContext, getIn } from "formik";
import _isEmpty from "lodash/isEmpty";
import _startCase from "lodash/startCase";
import _cloneDeep from "lodash/cloneDeep";
import _omit from "lodash/omit";
import { scrollToElement, useFieldData } from "@js/oarepo_ui";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";

// component to be used downstream of Formik that plugs into Formik's state and displays any errors
// that apiClient sent to formik in auxilary keys. The keys are later removed when submitting the form

const findAccordion = (fieldPath, accordionData) => {
  const splitPath = fieldPath.split(".");
  let matchedAccordion;
  for (let i = splitPath.length; i > 0; i--) {
    const partialPath = splitPath.slice(0, i).join(".");
    matchedAccordion = accordionData.find((accordion) =>
      accordion.includesPaths.some((path) => partialPath.includes(path))
    );
    if (matchedAccordion) {
      break;
    }
  }
  return matchedAccordion;
};
// function to turn last part of fieldPath from form camelCase to Camel Case
const titleCase = (fieldPath) =>
  _startCase(fieldPath.split(".")[fieldPath.split(".").length - 1]);

const CustomMessage = ({ children, ...uiProps }) => {
  const { setErrors, errors } = useFormikContext();
  const formikErrorsCopy = _cloneDeep(errors);
  const handleDismiss = () => {
    const errorsWithoutInternalErrorFields = _omit(formikErrorsCopy, [
      "BEvalidationErrors",
      "FEvalidationErrors",
      "httpErrors",
      "successMessage",
    ]);
    setErrors(errorsWithoutInternalErrorFields);
  };
  return (
    <Message
      onDismiss={handleDismiss}
      className="rel-mb-2 form-feedback"
      style={{
        boxShadow: "none",
        paddingLeft: "8rem",
        paddingRight: "8rem",
      }}
      {...uiProps}
    >
      {children}
    </Message>
  );
};

CustomMessage.propTypes = {
  children: PropTypes.node,
};

export const FormFeedback = ({
  activeAccordion,
  handleAccordionChange,
  accordionData,
}) => {
  const { errors } = useFormikContext();
  const beValidationErrors = getIn(errors, "BEvalidationErrors", {});
  const feValidationErrors = getIn(errors, "FEvalidationErrors", {});
  let httpError = getIn(errors, "httpErrors", "");
  if (httpError?.response?.data) {
    httpError = httpError?.response?.data.message;
  }
  const { getFieldData } = useFieldData();
  const handleErrorClick = (fieldPath) => {
    const accordion = findAccordion(fieldPath, accordionData);
    if (accordion) {
      handleAccordionChange(accordion.id);
      setTimeout(() => scrollToElement(fieldPath), 100);
    }
  };
  const successMessage = getIn(errors, "successMessage", "");
  if (!_isEmpty(beValidationErrors))
    return (
      <CustomMessage negative color="orange">
        <Message.Header>{beValidationErrors?.errorMessage}</Message.Header>
        <Message.List>
          {beValidationErrors?.errors?.map((error, index) => {
            const label = getFieldData({
              fieldPath: error.field,
              fieldRepresentation: "text",
            })?.label;
            return (
              <Message.Item
                onClick={() => handleErrorClick(error.field)}
                key={`${error.field}-${index}`}
              >{`${
                label || // ugly hack, but simply the path for file validation errors is completely
                // different and there does not seem to be a reasonable way to make translations
                // it is not clear can there be other validation errors for files than the one below
                (error.field === "files.enabled"
                  ? i18next.t("Files")
                  : titleCase(error.field))
              }: ${error.messages.join(" ")}`}</Message.Item>
            );
          })}
        </Message.List>
      </CustomMessage>
    );
  if (!_isEmpty(feValidationErrors))
    return (
      <CustomMessage negative color="orange">
        <Message.Header>{feValidationErrors?.errorMessage}</Message.Header>
        <Message.List>
          {feValidationErrors?.errors?.map((error, index) => {
            const [key, value] = Object.entries(error)[0];
            return (
              <Message.Item
                onClick={() => scrollToElement(`label[for="metadata.${key}"]`)}
                key={`${key}-${index}`}
              >
                {value}
              </Message.Item>
            );
          })}
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
