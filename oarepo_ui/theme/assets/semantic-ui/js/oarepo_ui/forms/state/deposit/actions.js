import _isEmpty from "lodash/isEmpty";
import _ from "lodash";
import {
  DRAFT_DELETE_FAILED,
  DRAFT_DELETE_STARTED,
  DRAFT_HAS_VALIDATION_ERRORS,
  DRAFT_PREVIEW_FAILED,
  DRAFT_PREVIEW_STARTED,
  DRAFT_SAVE_FAILED,
  DRAFT_SAVE_STARTED,
  DRAFT_SAVE_SUCCEEDED,
  SET_COMMUNITY,
} from "@js/invenio_rdm_records/src/deposit/state/types";
import { CLEAR_VALIDATION_ERRORS, SET_VALIDATION_ERRORS } from "./types";
import { i18next } from "@translations/oarepo_ui/i18next";

async function changeURLAfterCreation(draftURL) {
  window.history.replaceState(undefined, "", draftURL);
}

export const saveDraftWithUrlUpdate = async (draft, draftsService) => {
  const hasAlreadyId = !!draft.id;
  const response = await draftsService.save(draft);

  const draftHasValidationErrors = !_isEmpty(response.errors);

  // In case of invalid values, on the second draft save, the form doesn't report the errors. This happens
  // because the backend doesn't save invalid metadata. Here we are merging draft state with backend
  // response in order not to lose those invalid values from the form state and have the errors reported.
  if (draftHasValidationErrors) {
    const mergingValues = {
      metadata: draft.metadata,
      custom_fields: draft.custom_fields,
    };

    response.data = _.merge(response.data, mergingValues);
  }

  if (!hasAlreadyId) {
    // draft was created, change URL to add the draft PID
    const draftURL = response.data.links.edit_html;
    changeURLAfterCreation(draftURL);
  }
  return response;
};

function _hasValidationErrorsWithSeverityError(errors) {
  if (typeof errors === "object") {
    if (
      Object.hasOwn(errors, "message") &&
      Object.hasOwn(errors, "severity") &&
      Object.hasOwn(errors, "description")
    ) {
      if (errors["severity"] === "error") {
        return true;
      }
    }
    for (const key of Object.keys(errors)) {
      if (key !== "message" && key !== "severity" && key !== "description") {
        return _hasValidationErrorsWithSeverityError(errors[key]);
      }
    }
  } else {
    // If the error message is a string and not an object with `message`, `severity`, and `description` keys, then it's an error.
    return true;
  }
}

async function _saveDraft(
  draft,
  draftsService,
  {
    depositState,
    dispatchFn,
    failType,
    partialValidationActionType,
    showOnlyValidationErrorsWithSeverityError,
    ignoreValidationErrors = false,
    successMessage,
    errorMessage,
  } = {}
) {
  let response;

  try {
    response = await saveDraftWithUrlUpdate(draft, draftsService);
  } catch (error) {
    console.error("Error saving draft", error, draft);
    dispatchFn({
      type: failType,
      payload: {
        errors: error.errors,
        formFeedbackMessage: i18next.t(error?.errors?.message),
      },
    });
    throw error;
  }

  if (ignoreValidationErrors) {
    dispatchFn({
      type: DRAFT_SAVE_SUCCEEDED,
      payload: { data: response.data, formFeedbackMessage: successMessage },
    });
    return response;
  }
  const draftHasValidationErrors = showOnlyValidationErrorsWithSeverityError
    ? _hasValidationErrorsWithSeverityError(response.errors)
    : !_isEmpty(response?.errors);
  const draftValidationErrorResponse = draftHasValidationErrors ? response : {};
  // Throw validation errors from the partially saved draft
  if (draftHasValidationErrors) {
    dispatchFn({
      type: partialValidationActionType,
      payload: {
        data: draftValidationErrorResponse.data,
        errors: draftValidationErrorResponse.errors,
        formFeedbackMessage: errorMessage,
      },
    });
  } else {
    dispatchFn({
      type: DRAFT_SAVE_SUCCEEDED,
      payload: { data: response.data, formFeedbackMessage: successMessage },
    });
  }

  return response;
}

export const save = (
  draft,
  {
    successMessage = i18next.t("Draft saved successfully."),
    errorMessage = i18next.t(
      "Draft saved with validation errors. Please correct the following issues and try again:"
    ),
    ignoreValidationErrors = false,
  } = {}
) => {
  return async (dispatch, getState, config) => {
    dispatch({
      type: DRAFT_SAVE_STARTED,
    });

    const response = await _saveDraft(draft, config.service.drafts, {
      depositState: getState().deposit,
      dispatchFn: dispatch,
      failType: DRAFT_SAVE_FAILED,
      partialValidationActionType: DRAFT_HAS_VALIDATION_ERRORS,
      showOnlyValidationErrorsWithSeverityError: false,
      ignoreValidationErrors,
      successMessage,
      errorMessage,
    });
    return response;
  };
};

export const preview = (
  draft,
  {
    ignoreValidationErrors = true,
    successMessage = i18next.t(
      "Your draft was saved. Redirecting to the preview page..."
    ),
    errorMessage,
  } = {}
) => {
  return async (dispatch, getState, config) => {
    dispatch({
      type: DRAFT_PREVIEW_STARTED,
    });

    const response = await _saveDraft(draft, config.service.drafts, {
      depositState: getState().deposit,
      dispatchFn: dispatch,
      failType: DRAFT_PREVIEW_FAILED,
      partialValidationActionType: DRAFT_HAS_VALIDATION_ERRORS,
      ignoreValidationErrors: ignoreValidationErrors,
      showOnlyValidationErrorsWithSeverityError: true,
      successMessage,
      errorMessage,
    });
    const recordUrl = response.data.links.self_html;
    // redirect to the preview page
    window.location = recordUrl;
  };
};

/**
 * Returns the function that controls draft deletion.
 *
 * This function is different from the save/publish above because this thunk
 * is independent of form submission.
 */
export const delete_ = (draft, { redirectUrl = "/me/records" }) => {
  return async (dispatch, getState, config) => {
    dispatch({
      type: DRAFT_DELETE_STARTED,
    });

    try {
      await config.service.drafts.delete(draft.links);
      // redirect to the the uploads page after deleting/discarding a draft
      window.location.replace(redirectUrl);
    } catch (error) {
      console.error("Error deleting draft", error);
      dispatch({
        type: DRAFT_DELETE_FAILED,
        payload: { errors: error.errors },
      });
      throw error;
    }
  };
};

export const changeSelectedCommunity = (communityId) => {
  return async (dispatch) => {
    dispatch({
      type: SET_COMMUNITY,
      payload: communityId,
    });
  };
};

export const clearErrors = () => {
  return (dispatch) => {
    dispatch({
      type: CLEAR_VALIDATION_ERRORS,
      payload: { data: {}, errors: {} },
    });
  };
};

export const setErrors = (errors, formFeedbackMessage) => {
  return (dispatch, getState, config) => {
    dispatch({
      type: SET_VALIDATION_ERRORS,
      payload: {
        errors: config.recordSerializer.deserializeErrors(errors),
        formFeedbackMessage,
      },
    });
  };
};
