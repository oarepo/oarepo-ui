import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Grid, Ref, Sticky, Card } from "semantic-ui-react";
import { useSelector } from "react-redux";
import { buildUID } from "react-searchkit";
import Overridable from "react-overridable";
import { useFormikContext } from "formik";
import { useFormConfig } from "../../hooks";
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

export const WizardFormLayout = ({ sections, record, overridableIdPrefix }) => {
  return (
    <Grid>
      <Grid.Column id="main-content" mobile={16} tablet={16} computer={16}>
        <Overridable
          id={buildUID(overridableIdPrefix, "WizardForm.container")}
          record={record}
        >
          <TabForm sections={sections} />
        </Overridable>
        <FormikStateLogger />
      </Grid.Column>
    </Grid>
  );
};

WizardFormLayout.propTypes = {
  sections: PropTypes.arrayOf(PropTypes.object),
  record: PropTypes.object,
  overridableIdPrefix: PropTypes.string,
};

export const MonolithFormLayout = ({ record, overridableIdPrefix }) => {
  const sidebarRef = React.useRef(null);
  const formFeedbackRef = React.useRef(null);

  return (
    <Grid>
      <Ref innerRef={formFeedbackRef}>
        <Grid.Column id="main-content" mobile={16} tablet={16} computer={11}>
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

MonolithFormLayout.propTypes = {
  record: PropTypes.object,
  overridableIdPrefix: PropTypes.string,
};

export const BaseFormLayout = ({ sections, useWizardForm = false }) => {
  const record = useSelector((state) => state.deposit.record);
  const { overridableIdPrefix } = useFormConfig();
  const { dirty } = useFormikContext();

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
    <WizardFormLayout
      sections={sections}
      record={record}
      overridableIdPrefix={overridableIdPrefix}
    />
  ) : (
    <MonolithFormLayout
      record={record}
      overridableIdPrefix={overridableIdPrefix}
    />
  );
};

BaseFormLayout.propTypes = {
  // eslint-disable-next-line react/require-default-props
  useWizardForm: PropTypes.bool,
  sections: PropTypes.arrayOf(PropTypes.object),
};

export default BaseFormLayout;
