import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { BaseForm } from "../BaseForm";
import { FormFeedback } from "../FormFeedback";
import { FormikStateLogger } from "../FormikStateLogger";
import { SaveButton } from "../SaveButton";
import { PublishButton } from "../PublishButton";
import { PreviewButton } from "../PreviewButton";
import { Grid, Ref, Sticky, Card, Header } from "semantic-ui-react";
import {
  useFormConfig,
  getTitleFromMultilingualObject,
  serializeErrors,
  decodeUnicodeBase64,
} from "@js/oarepo_ui";
import { buildUID } from "react-searchkit";
import Overridable from "react-overridable";
import { CustomFields } from "react-invenio-forms";
import { getIn, useFormikContext } from "formik";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useSanitizeInput } from "../../hooks";

const FormTitle = () => {
  const { values } = useFormikContext();
  const { sanitizeInput } = useSanitizeInput();

  const recordTitle =
    getIn(values, "metadata.title", "") ||
    getTitleFromMultilingualObject(getIn(values, "title", "")) ||
    "";

  const sanitizedTitle = sanitizeInput(recordTitle);

  return (
    sanitizedTitle && (
      <Header as="h1">
        {/* cannot set dangerously html to SUI header directly, I think it is some internal
        implementation quirk (it says you cannot have both children and dangerouslySethtml even though
        there is no children given to the component) */}
        <span dangerouslySetInnerHTML={{ __html: sanitizedTitle }}></span>
      </Header>
    )
  );
};

export const BaseFormLayout = ({ formikProps }) => {
  const {
    record,
    formConfig: { overridableIdPrefix, custom_fields: customFields },
  } = useFormConfig();
  const sidebarRef = React.useRef(null);
  const formFeedbackRef = React.useRef(null);

  // on chrome there is an annoying issue where after deletion you are redirected, and then
  // if you click back on browser <-, it serves you the deleted page, which does not exist from the cache.
  // on firefox it does not happen.
  useEffect(() => {
    const handleUnload = () => {};

    const handleBeforeUnload = () => {};

    window.addEventListener("unload", handleUnload);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("unload", handleUnload);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const urlHash = window.location.hash.substring(1);
  let errorData;
  if (urlHash) {
    const decodedData = decodeUnicodeBase64(urlHash);
    errorData = JSON.parse(decodedData);
    window.history.replaceState(
      null,
      null,
      window.location.pathname + window.location.search
    );
  }

  return (
    <BaseForm
      onSubmit={() => {}}
      formik={{
        initialValues: record,
        validateOnChange: false,
        validateOnBlur: false,
        enableReinitialize: true,
        initialErrors:
          errorData?.errors?.length > 0
            ? serializeErrors(
                errorData.errors,
                errorData?.errorMessage ||
                  i18next.t(
                    "Your draft has validation errors. Please correct them and try again:"
                  )
              )
            : {},
        ...formikProps,
      }}
    >
      <Grid>
        <Ref innerRef={formFeedbackRef}>
          <Grid.Column id="main-content" mobile={16} tablet={16} computer={11}>
            <FormTitle />
            <Sticky context={formFeedbackRef} offset={20}>
              <Overridable
                id={buildUID(overridableIdPrefix, "Errors.container")}
              >
                <FormFeedback />
              </Overridable>
            </Sticky>
            <Overridable
              id={buildUID(overridableIdPrefix, "FormFields.container")}
              record={record}
            >
              <>
                <pre>
                  Add your form input fields here by overriding{" "}
                  {buildUID(overridableIdPrefix, "FormFields.container")}{" "}
                  component
                </pre>
                <FormikStateLogger render={true} />
              </>
            </Overridable>
            <Overridable
              id={buildUID(overridableIdPrefix, "CustomFields.container")}
            >
              <CustomFields
                config={customFields?.ui}
                templateLoaders={[
                  (widget) => import(`@templates/custom_fields/${widget}.js`),
                  (widget) => import(`react-invenio-forms`),
                ]}
              />
            </Overridable>
          </Grid.Column>
        </Ref>
        <Ref innerRef={sidebarRef}>
          <Grid.Column id="control-panel" mobile={16} tablet={16} computer={5}>
            {/* TODO: will remove sticky for now, to see how girls like it https://linear.app/ducesnet/issue/NTK-95/opravit-zobrazeni-embarga */}
            {/* <Sticky context={sidebarRef} offset={20}> */}
            <Overridable
              id={buildUID(overridableIdPrefix, "FormActions.container")}
              record={record}
            >
              <Card fluid>
                <Card.Content>
                  <Grid>
                    <Grid.Column
                      computer={8}
                      mobile={16}
                      className="left-btn-col"
                    >
                      <SaveButton fluid />
                    </Grid.Column>
                    <Grid.Column
                      computer={8}
                      mobile={16}
                      className="right-btn-col"
                    >
                      <PreviewButton fluid />
                    </Grid.Column>
                    <Grid.Column width={16} className="pt-10">
                      <PublishButton />
                    </Grid.Column>
                    {/* TODO:see if there is a way to provide URL here, seems that UI links are empty in the form */}
                    {/* <Grid.Column width={16} className="pt-10">
                        <DeleteButton redirectUrl="/me/records" />
                      </Grid.Column> */}
                  </Grid>
                </Card.Content>
              </Card>
            </Overridable>
            {/* </Sticky> */}
          </Grid.Column>
        </Ref>
      </Grid>
    </BaseForm>
  );
};

BaseFormLayout.propTypes = {
  formikProps: PropTypes.object,
};

export default BaseFormLayout;
