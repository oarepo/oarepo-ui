import { submitContextType } from "./submitContextTypes";
import { save, publish, _delete } from "./actions";
import { i18next } from "@translations/oarepo_ui/i18next";

export class Api {
  async call(actionName, formik, formikValues, ...rest) {
    let response;
    const action = this[actionName];
    try {
      response = await action.call(formikValues, ...rest);
      return action.onSubmitSuccess(response, formik, formikValues);
    } catch (error) {
      action.onSubmitError(error, formik);
      return false;
    }
  }
}

export class NrDocsApi extends Api {
  constructor() {
    super(); // Make sure to call the parent class constructor

    this.save = {
      call: save,
      context: submitContextType.save,
      onSubmitSuccess: (result, formik, formikValues) => {
        console.log(result);
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
      onSubmitError: (error, formik) => {
        console.log(error);
        if (
          error &&
          error.status === 400 &&
          error.message === "A validation error occurred."
        ) {
          error.errors?.forEach((err) =>
            formik.setFieldError(err.field, err.messages.join(" "))
          );
        }
      },

      // Add other functions if needed
    };

    this.publish = {
      call: publish,
      context: submitContextType.publish,
      onSubmitSuccess: (result, formik) => {
        window.location.href = result.links.self_html;
      },

      onSubmitError: (error, formik) => {
        if (
          error &&
          error.status === 400 &&
          error.message === "A validation error occurred."
        ) {
          error.errors?.forEach((err) =>
            formik.setFieldError(err.field, err.messages.join(" "))
          );
        }
      },
    };

    this.delete = {
      call: _delete,
      context: submitContextType.delete,
      onSubmitSuccess: (result, formik) => {
        // TODO: should redirect to /me page but we don't have that one yet
        window.location.href = "/docs/";
      },
      onSubmitError: (error, formik) => {
        console.log("error");
        if (
          error &&
          error.status === 400 &&
          error.message === "A validation error occurred."
        ) {
          error.errors?.forEach((err) =>
            formik.setFieldError(err.field, err.messages.join(" "))
          );
        }
      },
      // Add other functions if needed
    };
  }
}

export const OArepoApiCaller = new NrDocsApi();
