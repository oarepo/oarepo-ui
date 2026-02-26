import React, { useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Grid } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { save } from "../../state/deposit/actions";
import { useDepositFormAction, useFormConfig } from "../../hooks";
import { FormTabsProvider } from "../../contexts";
import { FormTabs } from "../FormTabs";
import { FormSteps } from "../FormSteps";
import { TabContent } from "../TabContent";
import { SaveButton } from "../SaveButton";
import { PreviewButton } from "../PreviewButton";
import { DeleteButton } from "../DeleteButton";
import Overridable from "react-overridable";
import { buildUID } from "react-searchkit";
import { PublishButton } from "@js/invenio_rdm_records/src/deposit/controls/PublishButton";
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
  const { overridableIdPrefix } = useFormConfig();
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
    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);
    const tab = params.get("tab");

    if (!tab) {
      params.set("tab", sectionKeys[activeStep]);
      url.search = params.toString();
      window.history.replaceState({}, "", url);
    }
  }, [activeStep, sectionKeys]);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      const idx = sectionKeys.indexOf(tab);
      if (idx >= 0) setActiveStepState(idx);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [sectionKeys]);

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

  return (
    <FormTabsProvider value={formTabContextValue}>
      <Grid stackable className="tab-form container">
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
        <Grid.Row className="mobile tablet only" centered>
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
            <Grid.Column className="computer only form-tabs-column" width={5}>
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
          <Grid.Row>
            <div className="flex justify-end form-actions-row">
              <div>
                <PreviewButton className="mr-10" />
              </div>
              <div>
                <DeleteButton className="mr-10" />
              </div>
              <div>
                <SaveButton className="ml-10" />
              </div>
              <div>
                <PublishButton record={record} className="ml-10" />
              </div>
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
