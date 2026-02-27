import React, { useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Grid, Message } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { save } from "@js/invenio_rdm_records/src/deposit/state/actions/deposit";
import { useDepositFormAction, useFormConfig } from "../../hooks";
import { FormTabsProvider } from "../../contexts";
import { FormTabs } from "../FormTabs";
import { FormSteps } from "../FormSteps";
import { TabContent } from "../TabContent";
import Overridable from "react-overridable";
import { buildUID } from "react-searchkit";
import {
  PublishButton,
  SaveButton,
  PreviewButton,
  DeleteButton,
} from "@js/invenio_rdm_records";
import { FormFeedback } from "../FormFeedback";
import { useFormikContext } from "formik";

export const TabForm = ({ sections = [] }) => {
  const dispatch = useDispatch();
  const record = useSelector((state) => state.deposit.record);
  const saveAction = useCallback(
    (values, params) => dispatch(save(values, params)),
    [dispatch],
  );

  const sectionKeys = useMemo(() => sections.map((s) => s.key), [sections]);
  const { overridableIdPrefix, permissions } = useFormConfig();
  const { dirty } = useFormikContext();
  const params = new URLSearchParams(window.location.search);
  const initialTabKey = params.get("tab");
  const initialStep = sectionKeys.indexOf(initialTabKey);
  const [activeStep, setActiveStepState] = React.useState(
    Math.max(initialStep, 0),
  );

  const { handleAction: handleSave } = useDepositFormAction({
    action: saveAction,
  });

  const handleSetStep = useCallback(
    (index) => {
      setActiveStepState(index);
      const url = new URL(window.location);
      url.searchParams.set("tab", sectionKeys[index]);
      window.history.replaceState({}, "", url);
      if (dirty) {
        handleSave();
      }
    },
    [sectionKeys, handleSave, dirty],
  );

  useEffect(() => {
    if (sections.length === 0) return;
    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);
    const tab = params.get("tab");

    if (!tab) {
      params.set("tab", sectionKeys[activeStep]);
      url.search = params.toString();
      window.history.replaceState({}, "", url);
    }
  }, [activeStep, sectionKeys, sections.length]);

  useEffect(() => {
    if (sections.length === 0) return;
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      const idx = sectionKeys.indexOf(tab);
      if (idx >= 0) setActiveStepState(idx);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [sectionKeys, sections.length]);

  const next = useCallback(async () => {
    if (activeStep < sections.length - 1) {
      handleSetStep(activeStep + 1);
    }
  }, [activeStep, sections.length, handleSetStep]);

  const back = useCallback(async () => {
    if (activeStep > 0) {
      handleSetStep(activeStep - 1);
    }
  }, [activeStep, handleSetStep]);

  const formTabContextValue = useMemo(
    () => ({
      activeStep,
      setActiveStep: handleSetStep,
      next,
      back,
    }),
    [activeStep, handleSetStep, next, back],
  );
  if (sections.length === 0) {
    return (
      <Message data-testid="tab-form-no-sections">
        <Message.Header>No sections defined</Message.Header>
        <p>Please provide at least one section to render the TabForm.</p>
      </Message>
    );
  }
  return (
    <FormTabsProvider value={formTabContextValue}>
      <Grid stackable className="tab-form container" data-testid="tab-form">
        <Grid.Row>
          <Overridable
            id={buildUID(overridableIdPrefix, "TabForm.FormFeedback")}
            activeStep={activeStep}
            sections={sections}
            onTabChange={handleSetStep}
          >
            <FormFeedback sections={sections} />
          </Overridable>
        </Grid.Row>

        {/* Mobile/Tablet: horizontal steps on top */}
        <Grid.Row className="mobile tablet only" centered data-testid="tab-form-steps-row">
          <Grid.Column className="steps-container" width={16}>
            <Overridable
              id={buildUID(overridableIdPrefix, "TabForm.steps")}
              activeStep={activeStep}
              sections={sections}
              onTabChange={handleSetStep}
            >
              <FormSteps
                activeStep={activeStep}
                sections={sections}
                onTabChange={handleSetStep}
              />
            </Overridable>
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          {/* Desktop: vertical tabs on left */}
          <Overridable
            id={buildUID(overridableIdPrefix, "TabForm.tabs")}
            activeStep={activeStep}
            sections={sections}
            onTabChange={handleSetStep}
          >
            <Grid.Column className="computer only form-tabs-column" width={5} data-testid="tab-form-tabs-column">
              <FormTabs
                activeStep={activeStep}
                sections={sections}
                onTabChange={handleSetStep}
              />
            </Grid.Column>
          </Overridable>

          {/* Content: full width on mobile/tablet, 11 cols on desktop */}
          <Overridable
            id={buildUID(overridableIdPrefix, "TabForm.content")}
            activeStep={activeStep}
            sections={sections}
            next={next}
            back={back}
          >
            <Grid.Column
              computer={11}
              tablet={16}
              mobile={16}
              className="tab-content-column pl-0 pr-0"
              data-testid="tab-form-content-column"
            >
              <TabContent
                activeStep={activeStep}
                sections={sections}
                next={next}
                back={back}
              />
            </Grid.Column>
          </Overridable>
        </Grid.Row>
        <Overridable id={buildUID(overridableIdPrefix, "TabForm.actions")}>
          <Grid.Row data-testid="tab-form-actions-row">
            <div className="flex justify-end form-actions-row">
              <Overridable
                id={buildUID(overridableIdPrefix, "TabForm.PreviewButton")}
              >
                <div>
                  <PreviewButton />
                </div>
              </Overridable>
              <Overridable
                id={buildUID(overridableIdPrefix, "TabForm.DeleteButton")}
                permissions={permissions}
              >
                <div>
                  {permissions?.can_delete_draft && record?.id && (
                    <DeleteButton />
                  )}
                </div>
              </Overridable>
              <Overridable
                id={buildUID(overridableIdPrefix, "TabForm.SaveButton")}
              >
                <div>
                  <SaveButton />
                </div>
              </Overridable>
              <Overridable
                id={buildUID(overridableIdPrefix, "TabForm.PublishButton")}
                record={record}
              >
                <div>
                  <PublishButton record={record} />
                </div>
              </Overridable>
            </div>
          </Grid.Row>
        </Overridable>
      </Grid>
    </FormTabsProvider>
  );
};

TabForm.propTypes = {
  sections: PropTypes.arrayOf(PropTypes.object),
};

export default TabForm;
