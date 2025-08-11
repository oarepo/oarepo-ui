import {
  DRAFT_DELETE_FAILED,
  DRAFT_DELETE_STARTED,
  DRAFT_FETCHED,
  DRAFT_HAS_VALIDATION_ERRORS,
  DRAFT_PREVIEW_FAILED,
  DRAFT_PREVIEW_STARTED,
  DRAFT_SAVE_FAILED,
  DRAFT_SAVE_STARTED,
  DRAFT_SAVE_SUCCEEDED,
  SET_COMMUNITY,
} from "@js/invenio_rdm_records/src/deposit/state/types";
import { CLEAR_VALIDATION_ERRORS, SET_VALIDATION_ERRORS } from "./types";

export const depositReducer = (state = {}, action) => {
  switch (action.type) {
    case DRAFT_SAVE_STARTED:
    case DRAFT_DELETE_STARTED:
    case DRAFT_PREVIEW_STARTED:
      return {
        ...state,
        actionState: action.type,
      };
    case DRAFT_FETCHED:
    case DRAFT_SAVE_SUCCEEDED:
      return {
        ...state,
        record: {
          // populate record only with fresh backend response
          ...action.payload.data,
        },
        formFeedbackMessage: action.payload.formFeedbackMessage,
        errors: {},
        actionState: action.type,
        actionStateExtra: {},
      };
    case DRAFT_HAS_VALIDATION_ERRORS:
      return {
        ...state,
        record: {
          ...state.record,
          ...action.payload.data,
        },
        errors: { ...action.payload.errors },
        actionState: action.type,
        formFeedbackMessage: action.payload.formFeedbackMessage,
      };
    case DRAFT_SAVE_FAILED:
    case DRAFT_DELETE_FAILED:
    case DRAFT_PREVIEW_FAILED:
      return {
        ...state,
        errors: { ...action.payload.errors },
        actionState: action.type,
        actionStateExtra: {},
        formFeedbackMessage: action.payload.formFeedbackMessage,
      };
    case SET_COMMUNITY: {
      return {
        ...state,
        record: {
          ...state.record,
          parent: {
            ...state.record.parent,
            communities: {
              ...state.record.parent.communities,
              default: action.payload, // action.payload is communityId
            },
          },
        },
      };
    }
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

    default:
      return state;
  }
};
