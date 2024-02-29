import React from "react";
import PropTypes from "prop-types";
import { BaseForm } from "../BaseForm";
import { FormFeedback } from "../FormFeedback";
import { FormikStateLogger } from "../FormikStateLogger";
import { SaveButton } from "../SaveButton";
import { PublishButton } from "../PublishButton";
import { PreviewButton } from "../PreviewButton";
import { ValidateButton } from "../ValidateButton";
import { Grid, Ref, Sticky, Card } from "semantic-ui-react";
import { useFormConfig } from "@js/oarepo_ui";
import { buildUID } from "react-searchkit";
import Overridable from "react-overridable";

export const BaseFormLayout = ({ formikProps }) => {
  const { record, formConfig: {overridableIdPrefix} } = useFormConfig();
  const sidebarRef = React.useRef(null);
  const formFeedbackRef = React.useRef(null);

  return (
    <BaseForm
      onSubmit={() => {}}
      formik={{
        initialValues: record,
        validateOnChange: false,
        validateOnBlur: false,
        enableReinitialize: true,
        ...formikProps,
      }}
    >
      <Grid>
        <Ref innerRef={formFeedbackRef}>
          <Grid.Column id="main-content" mobile={16} tablet={16} computer={11}>
            <Sticky context={formFeedbackRef} offset={20}>
              <Overridable
                id={buildUID(overridableIdPrefix, "Errors.container")}
              >
                <FormFeedback />
              </Overridable>
            </Sticky>
            <Overridable
              id={buildUID(overridableIdPrefix, "InputFields.container")}
            >
              <>
                <pre>
                  Add your form input fields here by overriding{" "}
                  {buildUID(overridableIdPrefix, "FormApp.inputs")} component
                </pre>
                <FormikStateLogger render={true} />
              </>
            </Overridable>
          </Grid.Column>
        </Ref>
        <Ref innerRef={sidebarRef}>
          <Grid.Column id="control-panel" mobile={16} tablet={16} computer={5}>
            <Sticky context={sidebarRef} offset={20}>
              <Overridable
                id={buildUID(overridableIdPrefix, "FormActions.container")}
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
                      <Grid.Column width={16} className="pt-10">
                        <ValidateButton />
                      </Grid.Column>
                      {/* TODO:see if there is a way to provide URL here, seems that UI links are empty in the form */}
                      {/* <Grid.Column width={16} className="pt-10">
                        <DeleteButton redirectUrl="/other/" />
                      </Grid.Column> */}
                    </Grid>
                  </Card.Content>
                </Card>
              </Overridable>
            </Sticky>
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
