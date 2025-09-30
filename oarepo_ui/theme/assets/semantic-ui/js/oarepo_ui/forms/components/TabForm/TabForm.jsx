import React, { useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Grid } from "semantic-ui-react";
import { connect } from "react-redux";
import { save } from "../../state/deposit/actions";
import { useDepositFormAction, useFormConfig } from "../../hooks";
import { FormTabsProvider } from "../../contexts";
import { FormTabs } from "../FormTabs";
import { TabContent } from "../TabContent";
import { SaveButton } from "../SaveButton";
import { PreviewButton } from "../PreviewButton";
import { DeleteButton } from "../DeleteButton";
import Overridable from "react-overridable";
import { buildUID } from "react-searchkit";

const TabFormComponent = ({ sections, saveAction }) => {
  const sectionKeys = sections.map((s) => s.key);

  const { overridableIdPrefix } = useFormConfig();

  const params = new URLSearchParams(window.location.search);
  const initialTabKey = params.get("tab");
  const initialStep = sectionKeys.indexOf(initialTabKey);
  const [activeStep, setActiveStepState] = React.useState(
    Math.max(initialStep, 0)
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
      handleSave();
    },
    [sectionKeys, handleSave]
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
    [activeStep, handleSetStep, next, back]
  );

  return (
    <FormTabsProvider value={formTabContextValue}>
      <Grid>
        <Grid.Row>
          <Overridable
            id={buildUID(overridableIdPrefix, "TabForm.tabs")}
            activeStep={activeStep}
            sections={sections}
            onTabChange={handleSetStep}
          >
            <Grid.Column
              width={5}
              style={{ minHeight: "80vh", overflowY: "auto" }}
            >
              <FormTabs
                activeStep={activeStep}
                sections={sections}
                onTabChange={handleSetStep}
              />
            </Grid.Column>
          </Overridable>
          <Overridable
            id={buildUID(overridableIdPrefix, "TabForm.content")}
            activeStep={activeStep}
            sections={sections}
            next={next}
            back={back}
          >
            <Grid.Column
              width={11}
              style={{ minHeight: "80vh", overflowY: "auto" }}
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
            <div className="flex justify-end" style={{ width: "100%" }}>
              <div>
                <PreviewButton className="mr-10" />
              </div>
              <div>
                <DeleteButton className="mr-10" />
              </div>
              <div>
                <SaveButton className="ml-10" />
              </div>
            </div>
          </Grid.Row>
        </Overridable>
      </Grid>
    </FormTabsProvider>
  );
};

const mapDispatchToProps = {
  saveAction: (values, params) => save(values, params),
};

export const TabForm = connect(null, mapDispatchToProps)(TabFormComponent);

TabFormComponent.propTypes = {
  sections: PropTypes.arrayOf(PropTypes.object),
  //redux
  saveAction: PropTypes.func.isRequired,
};

export default TabForm;
