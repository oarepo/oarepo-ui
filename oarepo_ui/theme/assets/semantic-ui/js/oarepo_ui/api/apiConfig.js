import { submitContextType } from "./submitContextTypes";
import { i18next } from "@translations/invenio_app_rdm/i18next";

export const apiConfig = {
  save: {
    context: submitContextType.save,
    onSubmitSuccess: [
      // (result, formik) => {
      //   if (!values.id) {
      //     window.history.replaceState(
      //       undefined,
      //       "",
      //       new URL(result.links.self_html).pathname
      //     );
      //     formik.setValues(result);
      //   }
      // },
      (result, formik) => {
        window.history.replaceState(
          undefined,
          "",
          new URL(result.links.self_html).pathname
        );
        formik.setValues(result);
      },
      (result, formik) => {
        if (result.errors) {
          result.errors?.forEach((err) =>
            formik.setFieldError(err.field, err.messages.join(" "))
          );
          formik.setFieldValue("validationErrors", {
            errors: result.errors,
            errorMessage: i18next.t(
              "Form saved with validation errors. Fields listed below that failed validation were not saved to the server"
            ),
          });
        }
      },
    ],
  },
  publish: {
    context: submitContextType.publish,
    onSubmitSuccess: [
      (result, formik) => {
        window.location.href = result.links.self_html;
      },
    ],
  },
  delete: {
    context: submitContextType.delete,
    onSubmitSuccess: [
      (result, formik) => {
        //  TODO: should redirect to /me page but we don't have that one yet
        window.location.href = "/docs/";
      },
    ],
  },
};
