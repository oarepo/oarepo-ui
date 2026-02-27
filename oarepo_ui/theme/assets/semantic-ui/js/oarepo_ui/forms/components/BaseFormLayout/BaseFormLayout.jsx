import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Grid, Ref, Sticky, Header, Card } from "semantic-ui-react";
import { useSelector } from "react-redux";
import { getLocalizedValue } from "../../../util";
import { buildUID } from "react-searchkit";
import Overridable from "react-overridable";
import { getIn, useFormikContext } from "formik";
import { useSanitizeInput, useFormConfig } from "../../hooks";
import { TabForm } from "../TabForm";
import { FormFeedback } from "../FormFeedback";
import { DepositStatusBox } from "@js/invenio_rdm_records/src/deposit/components/DepositStatus";
import { FormikStateLogger } from "../FormikStateLogger";
import {
  PublishButton,
  SaveButton,
  PreviewButton,
  DeleteButton,
} from "@js/invenio_rdm_records";

export const FormTitle = () => {
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

export const BaseFormLayout = ({ sections, useWizardForm = false }) => {
  const record = useSelector((state) => state.deposit.record);
  const { overridableIdPrefix } = useFormConfig();
  const { dirty } = useFormikContext();
  const sidebarRef = React.useRef(null);
  const formFeedbackRef = React.useRef(null);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [dirty]);

  return useWizardForm ? (
    <Grid>
      <Grid.Column id="main-content" mobile={16} tablet={16} computer={16}>
        {/* TODO: do we really need to display the title? I think this is a redundant information */}
        <FormTitle />
        <Overridable
          id={buildUID(overridableIdPrefix, "WizardForm.container")}
          record={record}
        >
          <TabForm sections={sections} />
        </Overridable>
        <FormikStateLogger />
      </Grid.Column>
    </Grid>
  ) : (
    <Grid>
      <Ref innerRef={formFeedbackRef}>
        <Grid.Column id="main-content" mobile={16} tablet={16} computer={11}>
          {/* TODO: do we really need to display the title? I think this is a redundant information */}

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

BaseFormLayout.propTypes = {
  // eslint-disable-next-line react/require-default-props
  useWizardForm: PropTypes.bool,
  sections: PropTypes.arrayOf(PropTypes.object),
};

export default BaseFormLayout;
