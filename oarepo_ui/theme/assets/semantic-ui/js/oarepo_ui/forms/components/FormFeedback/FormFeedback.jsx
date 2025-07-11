import React from "react";
import { Message } from "semantic-ui-react";
import _startCase from "lodash/startCase";
import { scrollToElement, useFieldData } from "@js/oarepo_ui";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import { connect } from "react-redux";
import { clearErrors } from "../../state/deposit/actions";
import {
  DRAFT_HAS_VALIDATION_ERRORS,
  DRAFT_SAVE_SUCCEEDED,
  DRAFT_SAVE_FAILED,
  DRAFT_DELETE_FAILED,
  DRAFT_PREVIEW_FAILED,
} from "@js/invenio_rdm_records/src/deposit/state/types";

// component to be used downstream of Formik that plugs into Formik's state and displays any errors
// that apiClient sent to formik in auxilary keys. The keys are later removed when submitting the form

function flattenToPathValueArray(obj, prefix = "", res = []) {
  if (_.isObject(obj) && !_.isDate(obj) && !_.isRegExp(obj) && obj !== null) {
    _.forOwn(obj, (value, key) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      flattenToPathValueArray(value, newKey, res);
    });
  } else {
    res.push({ fieldPath: prefix, value: obj });
  }
  return res;
}

// function to turn last part of fieldPath from form camelCase to Camel Case
const titleCase = (fieldPath) =>
  _startCase(fieldPath.split(".")[fieldPath.split(".").length - 1]);

const CustomMessageComponent = ({ clearErrors, children, ...uiProps }) => {
  return (
    <Message
      onDismiss={clearErrors}
      className="rel-mb-2 form-feedback"
      {...uiProps}
    >
      {children}
    </Message>
  );
};

const mapDispatchToPropsErrors = (dispatch) => ({
  clearErrors: () => dispatch(clearErrors()),
});
export const CustomMessage = connect(
  null,
  mapDispatchToPropsErrors
)(CustomMessageComponent);

CustomMessageComponent.propTypes = {
  children: PropTypes.node,
};

const ErrorMessageItem = ({ error }) => {
  const { getFieldData } = useFieldData();
  const label = getFieldData({
    fieldPath: error.fieldPath,
    fieldRepresentation: "text",
  })?.label;

  const errorMessage =
    label ||
    // ugly hack, but simply the path for file validation errors is completely
    // different and there does not seem to be a reasonable way to make translations
    // it is not clear can there be other validation errors for files than the one below
    (error.fieldPath === "files.enabled"
      ? i18next.t("Files")
      : titleCase(error.fieldPath));

  return `${errorMessage}: ${error.value}`;
};

ErrorMessageItem.propTypes = {
  error: PropTypes.object.isRequired, // Expects the error object from BEvalidationErrors
};
const FormFeedbackComponent = ({
  errors,
  formFeedbackMessage,
  actionState,
}) => {
  const flattenedErrors = flattenToPathValueArray(errors);

  if (actionState === DRAFT_HAS_VALIDATION_ERRORS) {
    return (
      <CustomMessage negative color="orange">
        <Message.Header>{formFeedbackMessage}</Message.Header>
        <Message.List>
          {flattenedErrors?.map((error, index) => (
            <Message.Item
              onClick={() => scrollToElement(error.fieldPath)}
              key={`${error.fieldPath}-${index}`}
            >
              <ErrorMessageItem error={error} />
            </Message.Item>
          ))}
        </Message.List>
      </CustomMessage>
    );
  }

  if (
    actionState === DRAFT_SAVE_FAILED ||
    actionState === DRAFT_DELETE_FAILED ||
    actionState === DRAFT_PREVIEW_FAILED ||
    actionState?.endsWith("FAILED")
  ) {
    return (
      <CustomMessage negative color="orange">
        <Message.Header>
          {formFeedbackMessage ||
            i18next.t("Draft could not be saved. Please try again later.")}
        </Message.Header>
      </CustomMessage>
    );
  }

  if (
    actionState === DRAFT_SAVE_SUCCEEDED ||
    actionState?.endsWith("SUCCEEDED")
  ) {
    return (
      <CustomMessage positive color="green">
        <Message.Header>{formFeedbackMessage}</Message.Header>
      </CustomMessage>
    );
  }

  return null;
};

const mapStateToProps = (state) => ({
  errors: state.deposit.errors,
  formFeedbackMessage: state.deposit.formFeedbackMessage,
  actionState: state.deposit.actionState,
});

export const FormFeedback = connect(
  mapStateToProps,
  null
)(FormFeedbackComponent);
