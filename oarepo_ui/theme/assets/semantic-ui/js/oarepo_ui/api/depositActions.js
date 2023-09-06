import { i18next } from "@translations/oarepo_ui/i18next";
import { OARepoDepositApiClient } from "./client";

export class DepositAction {
  // add error handlers for 400 and 500 errors that arent validation errors
  onSubmitError(error, formik) {
    if (
      error &&
      error.status === 400 &&
      error.message === "A validation error occurred."
    ) {
      error.errors?.forEach((err) =>
        formik.setFieldError(err.field, err.messages.join(" "))
      );
    }
  }

  async call(actionName, formik, formikValues, ...rest) {
    let response;
    const action = this[actionName];
    try {
      response = await action.call(formikValues, ...rest);
      return action.onSubmitSuccess(response, formik, formikValues);
    } catch (error) {
      action.onSubmitError
        ? action.onSubmitError(error, formik)
        : this.onSubmitError(error, formik);
      return false;
    }
  }
}

export class DepositActions extends DepositAction {
  constructor() {
    super();

    this.save = {
      call: OARepoDepositApiClient.saveOrCreateDraft,
      onSubmitSuccess: (result, formik, formikValues) => {
        if (!formikValues.id) {
          window.history.replaceState(
            undefined,
            "",
            new URL(result.links.self_html).pathname
          );
          formik.setValues(result);
        }
        if (result.errors) {
          result.errors.forEach((error) =>
            formik.setFieldError(error.field, error.messages[0])
          );
          formik.setFieldValue("validationErrors", {
            errors: result.errors,
            errorMessage: i18next.t(
              "Form saved with validation errors. Fields listed below that failed validation were not saved to the server"
            ),
          });
        }
        return result;
      },
    };

    this.publish = {
      call: OARepoDepositApiClient.publishDraft,
      onSubmitSuccess: (result, formik) => {
        window.location.href = result.links.self_html;
      },
    };

    this.delete = {
      call: OARepoDepositApiClient.deleteDraft,
      onSubmitSuccess: (result, formik) => {
        // TODO: should redirect to /me page in user dashboard?? but we don't have that one yet
        window.location.href = "/docs/";
      },
    };
  }
}

export const OARepoFormActions = new DepositActions();
