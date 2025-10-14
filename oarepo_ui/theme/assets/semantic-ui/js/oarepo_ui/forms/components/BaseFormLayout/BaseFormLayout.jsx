import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { FormFeedback } from "../FormFeedback";
import { FormikStateLogger } from "../FormikStateLogger";
import { SaveButton } from "../SaveButton";
import { DeleteButton } from "../DeleteButton";
import { PreviewButton } from "../PreviewButton";
import { DepositStatusBox } from "@js/invenio_rdm_records/src/deposit/components/DepositStatus";
import { PublishButton } from "@js/invenio_rdm_records/src/deposit/controls/PublishButton";
import { ShareDraftButton } from "@js/invenio_app_rdm/deposit/ShareDraftButton";
import { Grid, Ref, Sticky, Card, Header } from "semantic-ui-react";
import { connect } from "react-redux";
import { getLocalizedValue } from "../../../util";
import { buildUID } from "react-searchkit";
import Overridable from "react-overridable";
import { CustomFields } from "react-invenio-forms";
import { getIn, useFormikContext } from "formik";
import { useSanitizeInput, useFormConfig } from "../../hooks";

const FormTitle = () => {
  const { values } = useFormikContext();
  const { sanitizeInput } = useSanitizeInput();

  const recordTitle =
    getIn(values, "metadata.title", "") ||
    getLocalizedValue(getIn(values, "title", "")) ||
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
  const {
    overridableIdPrefix,
    custom_fields: customFields,
    permissions,
    groupsEnabled,
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

  return (
    <Grid>
      <Ref innerRef={formFeedbackRef}>
        <Grid.Column id="main-content" mobile={16} tablet={16} computer={11}>
          <FormTitle />
          <Sticky context={formFeedbackRef} offset={20}>
            <Overridable id={buildUID(overridableIdPrefix, "Errors.container")}>
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
                <DepositStatusBox />
              </Card.Content>
              <Card.Content>
                <Grid relaxed>
                  <Grid.Column
                    computer={8}
                    mobile={16}
                    className="pb-0 left-btn-col"
                  >
                    <SaveButton fluid />
                  </Grid.Column>

                  <Grid.Column
                    computer={8}
                    mobile={16}
                    className="pb-0 right-btn-col"
                  >
                    <PreviewButton fluid />
                  </Grid.Column>

                  <Grid.Column width={16} className="pt-10">
                    <PublishButton fluid record={record} />
                  </Grid.Column>

                  <Grid.Column width={16} className="pt-0">
                    {(record.is_draft === null || permissions.can_manage) && (
                      <ShareDraftButton
                        record={record}
                        permissions={permissions}
                        groupsEnabled={groupsEnabled}
                      />
                    )}
                  </Grid.Column>
                  <Grid.Column width={16}>
                    <DeleteButton fluid />
                  </Grid.Column>
                </Grid>
              </Card.Content>
            </Card>
          </Overridable>
        </Grid.Column>
      </Ref>
    </Grid>
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
