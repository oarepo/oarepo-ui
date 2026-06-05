import axios from "axios";
import { i18next } from "@translations/oarepo_ui/i18next";
import { save } from "@js/invenio_rdm_records/src/deposit/state/actions/deposit";
import {
  DRAFT_HAS_VALIDATION_ERRORS,
  DRAFT_SAVE_SUCCEEDED,
} from "@js/invenio_rdm_records/src/deposit/state/types";
import {
  CLEAR_VALIDATION_ERRORS,
  DRAFT_PUBLISH_REQUEST_FAILED,
  DRAFT_PUBLISH_REQUEST_STARTED,
  SET_VALIDATION_ERRORS,
} from "./types";

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

const requestsApiClient = axios.create({
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/vnd.inveniordm.v1+json",
  },
});

const PUBLISH_DRAFT_REQUEST_TYPE = "publish_draft";

// Save the draft, then create a publish_draft request and immediately submit it.
// On success redirects to the request's detail page.
export const createPublishRequest = (draft) => {
  return async (dispatch, getState) => {
    // save() can throw on validation errors; either way it dispatches the
    // resulting state into redux, so swallow here and inspect actionState below.
    try {
      await dispatch(save(draft));
    } catch (e) {
      console.error(
        "Error saving draft before submitting publish request",
        e,
        draft
      );
    }

    const saveActionState = getState().deposit.actionState;
    if (saveActionState !== DRAFT_SAVE_SUCCEEDED) {
      if (saveActionState === DRAFT_HAS_VALIDATION_ERRORS) {
        // Re-dispatch with the same already-deserialized errors so we can attach
        // a publish-request-specific feedback message to the form feedback banner.
        dispatch({
          type: SET_VALIDATION_ERRORS,
          payload: {
            errors: getState().deposit.errors,
            formFeedbackMessage: i18next.t(
              "Request to publish draft could not be executed due to validation errors:"
            ),
          },
        });
      }
      // save failed (DRAFT_SAVE_FAILED) or partial-saved with validation errors;
      // leave the error state in place and stop.
      return;
    }

    dispatch({ type: DRAFT_PUBLISH_REQUEST_STARTED });

    const record = getState().deposit.record;
    const publishType = record?.expanded?.request_types?.find(
      (rt) => rt.type_id === PUBLISH_DRAFT_REQUEST_TYPE
    );
    const createLink = publishType?.links?.actions?.create;

    if (!createLink) {
      dispatch({
        type: DRAFT_PUBLISH_REQUEST_FAILED,
        payload: {
          errors: {
            message: `${PUBLISH_DRAFT_REQUEST_TYPE} request type is not available on this record.`,
          },
        },
      });
      return;
    }

    try {
      const createResp = await requestsApiClient.post(createLink, {});
      const submitLink = createResp.data?.links?.actions?.submit;
      if (submitLink) {
        await requestsApiClient.post(submitLink, {});
      }
      const redirectURL = createResp.data?.links?.self_html;
      if (redirectURL) {
        window.location.replace(redirectURL);
      }
    } catch (error) {
      console.error("Error submitting publish request", error, draft);
      dispatch({
        type: DRAFT_PUBLISH_REQUEST_FAILED,
        payload: {
          errors: error?.response?.data?.errors || { message: error.message },
        },
      });
    }
  };
};
