import { save } from "@js/invenio_rdm_records/src/deposit/state/actions/deposit";
import {
  DRAFT_HAS_VALIDATION_ERRORS,
  DRAFT_SAVE_FAILED,
  DRAFT_SAVE_SUCCEEDED,
} from "@js/invenio_rdm_records/src/deposit/state/types";
import {
  CLEAR_VALIDATION_ERRORS,
  DRAFT_PUBLISH_REQUEST_FAILED,
  DRAFT_PUBLISH_REQUEST_FAILED_WITH_VALIDATION_ERRORS,
  DRAFT_PUBLISH_REQUEST_STARTED,
  SET_VALIDATION_ERRORS,
} from "./types";
import { PUBLISH_DRAFT_REQUEST_TYPE } from "../../constants";

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

// TODO: this needs to be in oarepo-requests in reality
// Save the draft, then create a publish_draft request and immediately submit it.
// On success redirects to the request's detail page.
export const createPublishRequest = (
  draft,
  requestType = PUBLISH_DRAFT_REQUEST_TYPE
) => {
  return async (dispatch, getState, { apiClient, recordSerializer }) => {
    // Reuse Invenio's configured axios (CSRF, vnd.inveniordm.v1+json, withCredentials)
    // instead of standing up a parallel client.
    const http = apiClient.axiosWithConfig;
    // Invenio's save() re-throws on both partial-save validation errors and
    // hard save failures, but it has already dispatched the corresponding
    // actionState before throwing. We swallow only those two expected throws
    // so we can inspect actionState below and attach a publish-request-specific
    // feedback message; anything else is genuinely unexpected and must propagate.
    try {
      await dispatch(save(draft));
    } catch (e) {
      const s = getState().deposit.actionState;
      if (s !== DRAFT_HAS_VALIDATION_ERRORS && s !== DRAFT_SAVE_FAILED) {
        throw e;
      }
    }

    const saveActionState = getState().deposit.actionState;
    if (saveActionState !== DRAFT_SAVE_SUCCEEDED) {
      if (saveActionState === DRAFT_HAS_VALIDATION_ERRORS) {
        // Re-dispatch with the same already-deserialized errors under a
        // publish-request-specific actionState so FormFeedback's ACTIONS map
        // shows the publish-request banner instead of the generic save one.
        dispatch({
          type: DRAFT_PUBLISH_REQUEST_FAILED_WITH_VALIDATION_ERRORS,
          payload: { errors: getState().deposit.errors },
        });
      }
      // save failed (DRAFT_SAVE_FAILED) or partial-saved with validation errors;
      // leave the error state in place and stop.
      return;
    }

    // Resolve the create link before transitioning to STARTED so a TypeError
    // (e.g. record state mutated between button render and click) doesn't leave
    // actionState stuck at DRAFT_PUBLISH_REQUEST_STARTED with no recovery path.
    // PublishButton only mounts this flow when expanded.request_types contains
    // a publish_draft entry with a create link, so we can read it directly here.
    const record = getState().deposit.record;
    const createLink = record?.expanded?.request_types?.find(
      (rt) => rt.type_id === requestType
    )?.links?.actions?.create;

    if (!createLink) {
      dispatch({ type: DRAFT_PUBLISH_REQUEST_FAILED, payload: { errors: {} } });
      return;
    }
    dispatch({ type: DRAFT_PUBLISH_REQUEST_STARTED });

    try {
      const createResp = await http.post(createLink, {});
      const submitLink = createResp.data?.links?.actions?.submit;
      // TODO: big issue here, in case submit fails, you now don't have publish request in request_types. Even if you refresh the page
      // you will now see the direct Publish button instead of publish request button, because request_types is used for displaying
      // the publish request button (our publish request). Agreed to leave it for now like this, but we need to solve this in a better way
      // ideally, to have an argument on BE side, that would automatically make submit after create
      if (submitLink) {
        await http.post(submitLink, {});
      }
      const redirectURL = createResp.data?.links?.self_html;
      if (redirectURL) {
        window.location.replace(redirectURL);
      } else {
        throw new Error("Missing links.self_html in publish request response.");
      }
    } catch (error) {
      console.error("Error submitting publish request", error);
      dispatch({
        type: DRAFT_PUBLISH_REQUEST_FAILED,
        payload: {
          errors: recordSerializer.deserializeErrors(
            error?.response?.data?.errors || []
          ),
        },
      });
    }
  };
};
