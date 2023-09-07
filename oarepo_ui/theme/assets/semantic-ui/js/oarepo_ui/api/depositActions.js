import { i18next } from "@translations/oarepo_ui/i18next";
import { removeNullAndInternalFields } from "../util";
import _isEmpty from "lodash/isEmpty";

export class DepositActions {
  constructor(initializedApiClient, formik) {
    this.apiClient = initializedApiClient;
    this.formik = formik;
    this.isSubmitting = formik.isSubmitting;
  }

  async save() {
    let response;
    const cleanedValues = removeNullAndInternalFields(
      ["errors", "validationErrors", "httpErrors", "successMessage"],
      ["__key"]
    )(this.formik.values);
    this.formik.setSubmitting(true);
    this.formik.setErrors({});
    try {
      response = await this.apiClient.saveOrCreateDraft(cleanedValues);
      // when I am creating a new draft, it saves the response into formik's state, so that I would have access
      // to the draft and draft links in the app. I we don't do that then each time I click on save it will
      // create new draft, as I don't actually refresh the page, so the record from html is still empty. Invenio,
      // solves this by keeping record in the store, but the idea here is to not create some central state,
      // but use formik as some sort of auxiliary state.
      if (!this.formik.values.id) {
        window.history.replaceState(
          undefined,
          "",
          new URL(response.links.self_html).pathname
        );
      }
      this.formik.setValues(response);

      // save accepts posts/puts even with validation errors. Here I check if there are some errors in the response
      // body. Here I am setting the individual error messages to the field
      if (response.errors) {
        response.errors.forEach((error) =>
          this.formik.setFieldError(error.field, error.messages[0])
        );
        // here I am setting the state to be used by FormFeedback componene that plugs into the formik's context.
        // note that we are using removeNullAndInternalFields to clean this up before submitting
        this.formik.setFieldValue("validationErrors", {
          errors: response.errors,
          errorMessage: i18next.t(
            "Draft saved with validation errors. Fields listed below that failed validation were not saved to the server"
          ),
        });
        this.formik.setSubmitting(false);
        return false;
      }
      this.formik.setSubmitting(false);
      this.formik.setFieldValue(
        "successMessage",
        i18next.t("Draft saved successfully.")
      );
      return response;
    } catch (error) {
      console.log(error);
      // handle 400/500 errors. Here I am not sure how detailed we wish to be and what kind of
      // errors can we provide in case of errors on client/server
      this.formik.setFieldValue("httpErrors", error.message);
      this.formik.setSubmitting(false);
      return false;
    }
  }

  async publish() {
    // call save and if save returns false, exit
    if (!(await this.save())) return;
    // imperative form validation, if fails exit
    const validationErrors = await this.formik.validateForm();
    if (!_isEmpty(validationErrors)) return;
    this.formik.setSubmitting(true);

    let response;
    const cleanedValues = removeNullAndInternalFields(
      ["errors", "validationErrors", "httpErrors", "successMessage"],
      ["__key"]
    )(this.formik.values);

    try {
      response = await this.apiClient.publishDraft(cleanedValues);
      window.location.href = response.links.self_html;
      this.formik.setSubmitting(false);
      this.formik.setFieldValue(
        "successMessage",
        i18next.t(
          "Draft published successfully. Redirecting to record's detail page ..."
        )
      );

      return response;
    } catch (error) {
      // in case of validation errors on the server during publish, in RDM they return a 400 and below
      // error message. Not 100% sure if our server does the same.
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
      this.formik.setSubmitting(false);

      return false;
    }
  }

  async delete() {
    this.formik.setSubmitting(true);

    try {
      let response = await this.apiClient.deleteDraft(this.formik.values);

      // TODO: should redirect to /me page in user dashboard?? but we don't have that one yet
      window.location.href = "/docs/";
      this.formik.setSubmitting(false);
      this.formik.setFieldValue(
        "successMessage",
        i18next.t(
          "Draft deleted successfully. Redirecting to the main page ..."
        )
      );
      return response;
    } catch (error) {
      this.formik.setFieldValue("httpErrors", error.message);
      this.formik.setSubmitting(false);

      return false;
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
  // onSubmitSuccess: (result, formik) => {
  //   // TODO: should redirect to /me page in user dashboard?? but we don't have that one yet
  //   window.location.href = "/docs/";
  // },
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
}
