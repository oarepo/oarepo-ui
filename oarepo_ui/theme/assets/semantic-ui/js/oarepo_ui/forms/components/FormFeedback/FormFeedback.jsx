import { i18next } from "@translations/invenio_rdm_records/i18next";
import _get from "lodash/get";
import _isObject from "lodash/isObject";
import _isDate from "lodash/isDate";
import _isRegExp from "lodash/isRegExp";
import _forOwn from "lodash/forOwn";
import _startCase from "lodash/startCase";
import React, { useCallback, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Message } from "semantic-ui-react";
import { useFormTabs, useFieldData } from "../../hooks";
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
import { scrollToElement } from "../../../util";

const ACTIONS = {
  [DRAFT_SAVE_SUCCEEDED]: {
    feedback: "positive",
    message: i18next.t("Draft successfully saved."),
  },
  [DRAFT_HAS_VALIDATION_ERRORS]: {
    feedback: "warning",
    message: i18next.t("Draft saved with validation feedback in:"),
  },
  [DRAFT_LOADED_WITH_VALIDATION_ERRORS]: {
    feedback: "warning",
    message: i18next.t("Draft has validation feedback in:"),
  },
  [DRAFT_SAVE_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "The draft was not saved. Please try again. If the problem persists, contact user support.",
    ),
  },
  [DRAFT_PUBLISH_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "The draft was not published. Please try again. If the problem persists, contact user support.",
    ),
  },
  [DRAFT_PUBLISH_FAILED_WITH_VALIDATION_ERRORS]: {
    feedback: "negative",
    message: i18next.t(
      "The draft was not published. Draft saved with validation feedback in:",
    ),
  },
  [DRAFT_SUBMIT_REVIEW_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "The draft was not submitted for review. Please try again. If the problem persists, contact user support.",
    ),
  },
  [DRAFT_SUBMIT_REVIEW_FAILED_WITH_VALIDATION_ERRORS]: {
    feedback: "negative",
    message: i18next.t(
      "The draft was not submitted for review. Draft saved with validation feedback in",
    ),
  },
  [DRAFT_DELETE_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Draft deletion failed. Please try again. If the problem persists, contact user support.",
    ),
  },
  [DRAFT_PREVIEW_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Draft preview failed. Please try again. If the problem persists, contact user support.",
    ),
  },
  [RESERVE_PID_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Identifier reservation failed. Please try again. If the problem persists, contact user support.",
    ),
  },
  [DISCARD_PID_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Identifier could not be discarded. Please try again. If the problem persists, contact user support.",
    ),
  },
  [FILE_UPLOAD_SAVE_DRAFT_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Draft save failed before file upload. Please try again. If the problem persists, contact user support.",
    ),
  },
  [FILE_IMPORT_FAILED]: {
    feedback: "negative",
    message: i18next.t(
      "Files import from the previous version failed. Please try again. If the problem persists, contact user support.",
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
    section.includesPaths?.some(
      (path) => fieldPath === path || fieldPath.startsWith(`${path}.`),
    ),
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

export const CustomMessage = ({ children = null, ...uiProps }) => {
  const dispatch = useDispatch();
  const handleClearErrors = useCallback(
    () => dispatch(clearErrors()),
    [dispatch],
  );

  return (
    <Message
      onDismiss={handleClearErrors}
      className="mb-5 form-feedback"
      {...uiProps}
    >
      {children}
    </Message>
  );
};

CustomMessage.propTypes = {
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
  error: PropTypes.object.isRequired,
};

export const FormFeedback = ({ actions = {}, sections = [] }) => {
  const errors = useSelector((state) => state.deposit.errors);

  const actionState = useSelector((state) => state.deposit.actionState);

  const { activeStep, setActiveStep } = useFormTabs() || {};
  const timeoutRef = useRef(null);
  const allActions = { ...ACTIONS, ...actions };
  const flattenedErrors = flattenToPathValueArray(errors);
  const feedbackType = _get(allActions, [actionState, "feedback"]);
  const color = FEEDBACK_COLORS[feedbackType];

  const message = _get(allActions, [actionState, "message"]);
  const backendErrorMessage = errors.message || errors._schema;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleErrorClick = useCallback(
    (fieldPath) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (setActiveStep && activeStep !== undefined && sections.length > 0) {
        const sectionIndex = findSectionIndexForFieldPath(sections, fieldPath);
        if (sectionIndex >= 0 && sectionIndex !== activeStep) {
          setActiveStep(sectionIndex);
          timeoutRef.current = setTimeout(
            () => scrollToElement(fieldPath),
            100,
          );
          return;
        }
      }
      scrollToElement(fieldPath);
    },
    [activeStep, setActiveStep, sections],
  );
  if (!message) return null;
  return (
    <CustomMessage color={color}>
      <Message.Header>{backendErrorMessage || message}</Message.Header>
      {flattenedErrors?.length > 0 && (
        <Message.List>
          {flattenedErrors?.map((error, index) => (
            <Message.Item
              onClick={() => handleErrorClick(error.fieldPath)}
              key={`${error.fieldPath}-${index}`} // eslint-disable-line react/no-array-index-key
            >
              <ErrorMessageItem error={error} />
            </Message.Item>
          ))}
        </Message.List>
      )}
    </CustomMessage>
  );
};

FormFeedback.propTypes = {
  actions: PropTypes.object,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      includesPaths: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
};

export default FormFeedback;
