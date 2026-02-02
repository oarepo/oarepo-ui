import { i18next } from "@translations/invenio_rdm_records/i18next";
import _get from "lodash/get";
import _isObject from "lodash/isObject";
import _isDate from "lodash/isDate";
import _isRegExp from "lodash/isRegExp";
import _forOwn from "lodash/forOwn";
import _startCase from "lodash/startCase";
import React, { useCallback } from "react";
import { connect } from "react-redux";
import { Message } from "semantic-ui-react";
import { useFormTabs } from "../../hooks";
import {
  DISCARD_PID_FAILED,
  DRAFT_DELETE_FAILED,
  DRAFT_HAS_VALIDATION_ERRORS,
  DRAFT_PREVIEW_FAILED,
  DRAFT_PUBLISH_FAILED,
  DRAFT_PUBLISH_FAILED_WITH_VALIDATION_ERRORS,
  DRAFT_SAVE_FAILED,
  DRAFT_SAVE_SUCCEEDED,
  DRAFT_LOADED_WITH_VALIDATION_ERRORS,
  DRAFT_SUBMIT_REVIEW_FAILED,
  DRAFT_SUBMIT_REVIEW_FAILED_WITH_VALIDATION_ERRORS,
  FILE_IMPORT_FAILED,
  FILE_UPLOAD_SAVE_DRAFT_FAILED,
  RESERVE_PID_FAILED,
} from "@js/invenio_rdm_records/src/deposit/state/types";
import PropTypes from "prop-types";
import { clearErrors } from "../../../forms/state/deposit/actions";
import { useFieldData } from "../../hooks";
import { scrollToElement } from "../../../util";

const ACTIONS = {
  [DRAFT_SAVE_SUCCEEDED]: {
    feedback: "positive",
    message: i18next.t("Record successfully saved."),
  },
  [DRAFT_HAS_VALIDATION_ERRORS]: {
    feedback: "warning",
    message: i18next.t("Record saved with validation feedback in"),
  },
  [DRAFT_LOADED_WITH_VALIDATION_ERRORS]: {
    feedback: "warning",
    message: i18next.t("Draft has validation feedback in"),
  },
  [DRAFT_SAVE_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "The draft was not saved. Please try again. If the problem persists, contact user support."
    ),
  },
  [DRAFT_PUBLISH_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "The draft was not published. Please try again. If the problem persists, contact user support."
    ),
  },
  [DRAFT_PUBLISH_FAILED_WITH_VALIDATION_ERRORS]: {
    feedback: "negative",
    message: i18next.t(
      "The draft was not published. Record saved with validation feedback in"
    ),
  },
  [DRAFT_SUBMIT_REVIEW_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "The draft was not submitted for review. Please try again. If the problem persists, contact user support."
    ),
  },
  [DRAFT_SUBMIT_REVIEW_FAILED_WITH_VALIDATION_ERRORS]: {
    feedback: "negative",
    message: i18next.t(
      "The draft was not submitted for review. Record saved with validation feedback in"
    ),
  },
  [DRAFT_DELETE_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Draft deletion failed. Please try again. If the problem persists, contact user support."
    ),
  },
  [DRAFT_PREVIEW_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Draft preview failed. Please try again. If the problem persists, contact user support."
    ),
  },
  [RESERVE_PID_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Identifier reservation failed. Please try again. If the problem persists, contact user support."
    ),
  },
  [DISCARD_PID_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Identifier could not be discarded. Please try again. If the problem persists, contact user support."
    ),
  },
  [FILE_UPLOAD_SAVE_DRAFT_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Draft save failed before file upload. Please try again. If the problem persists, contact user support."
    ),
  },
  [FILE_IMPORT_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Files import from the previous version failed. Please try again. If the problem persists, contact user support."
    ),
  },
};

const FEEDBACK_COLORS = {
  positive: "green",
  warning: "yellow",
  negative: "red",
  info: "blue",
};

const findSectionIndexForFieldPath = (sections, fieldPath) => {
  if (!sections || !fieldPath) return -1;
  return sections.findIndex((section) =>
    section.includedPaths?.some(
      (path) => fieldPath === path || fieldPath.startsWith(`${path}.`)
    )
  );
};

// component to be used downstream of Formik that plugs into Formik's state and displays any errors
// that apiClient sent to formik in auxilary keys. The keys are later removed when submitting the form

function flattenToPathValueArray(obj, prefix = "", res = []) {
  if (_isObject(obj) && !_isDate(obj) && !_isRegExp(obj) && obj !== null) {
    _forOwn(obj, (value, key) => {
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

const CustomMessageComponent = ({
  clearErrors,
  children = null,
  ...uiProps
}) => {
  return (
    <Message
      style={{ width: "100%", color: "black" }}
      onDismiss={clearErrors}
      className="form-feedback"
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
  clearErrors: PropTypes.func.isRequired,
  // eslint-disable-next-line react/require-default-props
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
  errors = {},
  formFeedbackMessage,
  actionState,
  actions = {},
  sections = [],
}) => {
  const { activeStep, setActiveStep } = useFormTabs();
  const allActions = { ...ACTIONS, ...actions };
  const flattenedErrors = flattenToPathValueArray(errors);
  const feedbackType = _get(allActions, [actionState, "feedback"]);
  const color = FEEDBACK_COLORS[feedbackType];

  const message =
    formFeedbackMessage || _get(allActions, [actionState, "message"]);
  const backendErrorMessage = errors.message || errors._schema;

  const handleErrorClick = useCallback(
    (fieldPath) => {
      if (activeStep && sections.length > 0) {
        const sectionIndex = findSectionIndexForFieldPath(sections, fieldPath);
        if (sectionIndex >= 0 && sectionIndex !== activeStep) {
          setActiveStep(sectionIndex);
          setTimeout(() => scrollToElement(fieldPath), 100);
          return;
        }
      }
      scrollToElement(fieldPath);
    },
    [activeStep, setActiveStep, sections]
  );
  if (!message) return null;
  return (
    <CustomMessage color={color}>
      <Message.Header>{backendErrorMessage || message}</Message.Header>
      <Message.List>
        {flattenedErrors?.map((error, index) => (
          <Message.Item
            onClick={() => handleErrorClick(error.fieldPath)}
            // eslint-disable-next-line react/no-array-index-key
            key={`${error.fieldPath}-${index}`}
          >
            <ErrorMessageItem error={error} />
          </Message.Item>
        ))}
      </Message.List>
    </CustomMessage>
  );
};

FormFeedbackComponent.propTypes = {
  errors: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  formFeedbackMessage: PropTypes.string,
  actionState: PropTypes.string,
  actions: PropTypes.object,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      includedPaths: PropTypes.arrayOf(PropTypes.string),
    })
  ),
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
