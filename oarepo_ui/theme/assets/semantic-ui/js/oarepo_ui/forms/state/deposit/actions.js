import { CLEAR_VALIDATION_ERRORS, SET_VALIDATION_ERRORS } from "./types";

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
