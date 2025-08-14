import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { BaseForm } from "../BaseForm";
import { FormFeedback } from "../FormFeedback";
import { FormikStateLogger } from "../FormikStateLogger";
import { SaveButton } from "../SaveButton";
import { DeleteButton } from "../DeleteButton";
import { PreviewButton } from "../PreviewButton";
import { Grid, Ref, Sticky, Card, Header } from "semantic-ui-react";
import { connect } from "react-redux";
import { getTitleFromMultilingualObject } from "../../../util";
import { buildUID } from "react-searchkit";
import Overridable from "react-overridable";
import { CustomFields } from "react-invenio-forms";
import { getIn, useFormikContext } from "formik";
import { useSanitizeInput, useFormConfig, useFormikRef } from "../../hooks";
import _isEmpty from "lodash/isEmpty";

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
        <span dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />
      </Header>
    )
  );
};

const BaseFormLayoutComponent = ({ formikProps = {}, record, errors = {} }) => {
  const { overridableIdPrefix, custom_fields: customFields } = useFormConfig();
  const sidebarRef = React.useRef(null);
  const formFeedbackRef = React.useRef(null);
  const formikRef = useFormikRef();
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

  return (
    <BaseForm
      onSubmit={() => {}}
      formik={{
        initialValues: record,
        innerRef: formikRef,
        enableReinitialize: true,
        initialErrors: !_isEmpty(errors) ? errors : {},
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
                <FormikStateLogger render />
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
                      <DeleteButton redirectUrl="/me/records" />
                    </Grid.Column>
                  </Grid>
                </Card.Content>
              </Card>
            </Overridable>
          </Grid.Column>
        </Ref>
      </Grid>
    </BaseForm>
  );
};

const mapStateToProps = (state) => {
  return {
    record: state.deposit.record,
    errors: state.deposit.errors,
  };
};

export const BaseFormLayout = connect(
  mapStateToProps,
  null
)(BaseFormLayoutComponent);

BaseFormLayoutComponent.propTypes = {
  record: PropTypes.object.isRequired,
  // eslint-disable-next-line react/require-default-props
  errors: PropTypes.object,
  // eslint-disable-next-line react/require-default-props
  formikProps: PropTypes.object,
};

export default BaseFormLayout;
