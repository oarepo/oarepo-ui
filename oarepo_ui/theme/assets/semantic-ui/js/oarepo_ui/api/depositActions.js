import { i18next } from "@translations/oarepo_ui/i18next";
import { removeNullAndInternalFields } from "../util";
import _isEmpty from "lodash/isEmpty";

// export class DepositAction {
//   //TODO:  add error handlers for 400 and 500 errors that arent validation errors
//   onSubmitError(error, formik) {
//     if (
//       error &&
//       error.status === 400 &&
//       error.message === "A validation error occurred."
//     ) {
//       error.errors?.forEach((err) =>
//         formik.setFieldError(err.field, err.messages.join(" "))
//       );
//     }
//   }

//   async call(actionName, formik, formikValues, ...rest) {
//     let response;
//     const action = this[actionName];
//     try {
//       const cleanedValues = removeNullAndInternalFields(
//         ["errors", "validationErrors"],
//         ["__key"]
//       )(formikValues, formik);
//       response = await action.call(cleanedValues, ...rest);
//       return action.onSubmitSuccess(response, formik, formikValues);
//     } catch (error) {
//       console.log(error);
//       action.onSubmitError
//         ? action.onSubmitError(error, formik)
//         : this.onSubmitError(error, formik);
//       return false;
//     }
//   }
// }

export class DepositActions {
  constructor(initializedApiClient, formik) {
    this.apiClient = initializedApiClient;
    this.formik = formik;
  }

  async save() {
    let response;
    const cleanedValues = removeNullAndInternalFields(
      ["errors", "validationErrors", "httpErrors"],
      ["__key"]
    )(this.formik.values);
    try {
      response = await this.apiClient.saveOrCreateDraft(cleanedValues);
      if (!this.formik.values.id) {
        window.history.replaceState(
          undefined,
          "",
          new URL(response.links.self_html).pathname
        );
        this.formik.setValues(response);
      }
      if (response.errors) {
        response.errors.forEach((error) =>
          this.formik.setFieldError(error.field, error.messages[0])
        );
        this.formik.setFieldValue("validationErrors", {
          errors: response.errors,
          errorMessage: i18next.t(
            "Form saved with validation errors. Fields listed below that failed validation were not saved to the server"
          ),
        });
        return false;
      }
      return response;
    } catch (error) {
      if (
        error &&
        error.status === 400 &&
        error.message === "A validation error occurred."
      ) {
        error.errors?.forEach((err) =>
          this.formik.setFieldError(err.field, err.messages.join(" "))
        );
      } else {
        this.formik.setFieldValue("httpErrors", error.message);
      }
    }
  }

  async publish() {
    if (!this.save()) return;
    if (!_isEmpty(this.formik.validateForm())) return;
    console.log("publishing]");
    let response;
    const cleanedValues = removeNullAndInternalFields(
      ["errors", "validationErrors", "httpErrors"],
      ["__key"]
    )(this.formik.values);

    try {
      response = await this.apiClient.publishDraft(cleanedValues);
      window.location.href = response.links.self_html;
    } catch (error) {
      console.log(error);
    }
  }
  //   console.log(this.formik);
  //   this.save = {
  //     call: this.apiClient.saveOrCreateDraft,
  //     onSubmitSuccess: (result, formik) => {
  // if (!formik.values.id) {
  //   window.history.replaceState(
  //     undefined,
  //     "",
  //     new URL(result.links.self_html).pathname
  //   );
  //   formik.setValues(result);
  // }
  // if (result.errors) {
  //   result.errors.forEach((error) =>
  //     formik.setFieldError(error.field, error.messages[0])
  //   );
  //   formik.setFieldValue("validationErrors", {
  //     errors: result.errors,
  //     errorMessage: i18next.t(
  //       "Form saved with validation errors. Fields listed below that failed validation were not saved to the server"
  //     ),
  //   });
  // }
  // return result;
  //     },
  //   };

  //   this.publish = {
  //     call: this.apiClient.publishDraft,
  //     onSubmitSuccess: (result, formik) => {
  // window.location.href = result.links.self_html;
  //     },
  //   };

  //   this.delete = {
  //     call: this.apiClient.deleteDraft,
  //     onSubmitSuccess: (result, formik) => {
  //       // TODO: should redirect to /me page in user dashboard?? but we don't have that one yet
  //       window.location.href = "/docs/";
  //     },
  //   };
  // }

  // async call(actionName, formik, ...rest) {
  //   let response;
  //   const action = this[actionName];
  //   try {
  //     const cleanedValues = removeNullAndInternalFields(
  //       ["errors", "validationErrors"],
  //       ["__key"]
  //     )(this.formik.values);
  //     response = await action.call(cleanedValues, ...rest);
  //     return action.onSubmitSuccess(response, this.formik);
  //   } catch (error) {
  //     console.log(error);
  //     action.onSubmitError
  //       ? action.onSubmitError(error, this.formik)
  //       : this.onSubmitError(error, this.formik);
  //     return false;
  //   }
  // }

  saveAndPublish = async () => {
    const saveResponse = this.call();
  };

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
}

// export const OARepoFormActions = new DepositActions(OARepoDepositApiClient);
