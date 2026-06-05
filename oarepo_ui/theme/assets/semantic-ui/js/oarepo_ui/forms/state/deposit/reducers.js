import invenioDepositReducer from "@js/invenio_rdm_records/src/deposit/state/reducers/deposit";
import { DRAFT_HAS_VALIDATION_ERRORS } from "@js/invenio_rdm_records/src/deposit/state/types";
import { CLEAR_VALIDATION_ERRORS, SET_VALIDATION_ERRORS } from "./types";

export const depositReducer = (state = {}, action) => {
  switch (action.type) {
    case CLEAR_VALIDATION_ERRORS:
      return {
        ...state,
        errors: {},
        actionState: "",
        formFeedbackMessage: "",
      };
    case SET_VALIDATION_ERRORS:
      return {
        ...state,
        errors: { ...action.payload.errors },
        actionState: DRAFT_HAS_VALIDATION_ERRORS,
        formFeedbackMessage: action.payload.formFeedbackMessage,
      };
    default: {
      const next = invenioDepositReducer(state, action);
      // Any actionState transition wipes a stale formFeedbackMessage.
      if (state.formFeedbackMessage && next.actionState !== state.actionState) {
        return { ...next, formFeedbackMessage: "" };
      }
      return next;
    }
  }
};
