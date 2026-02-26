import React from "react";
import { Segment, Button, Icon, Message } from "semantic-ui-react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useFormConfig } from "../../hooks";
import { i18next } from "@translations/oarepo_ui/i18next";
import Overridable from "react-overridable";
import { ErrorBoundary } from "react-error-boundary";

const TabErrorFallback = ({ error, resetErrorBoundary }) => (
  <Message negative icon>
    <Icon name="exclamation triangle" />
    <Message.Content>
      <Message.Header>
        {i18next.t("Something went wrong in this section")}
      </Message.Header>
      <p>{error?.message}</p>
      <Button basic color="red" size="small" onClick={resetErrorBoundary}>
        <Icon name="refresh" />
        {i18next.t("Try again")}
      </Button>
    </Message.Content>
  </Message>
);

TabErrorFallback.propTypes = {
  error: PropTypes.object,
  resetErrorBoundary: PropTypes.func.isRequired,
};

export const TabContent = ({ activeStep, sections, next, back }) => {
  const record = useSelector((state) => state.deposit.record);
  const formConfig = useFormConfig();
  const section = sections[activeStep];
  const previousStepLabel =
    activeStep > 0 ? sections[activeStep - 1].label : null;
  const nextStepLabel =
    activeStep < sections.length - 1 ? sections[activeStep + 1].label : null;

  return (
    <Segment className="tab-content borderless shadowless">
      <ErrorBoundary
        FallbackComponent={TabErrorFallback}
        resetKeys={[section?.key]}
        onReset={() => {
          // Optional: any cleanup when error is reset
        }}
      >
        <div className="tab-content-body">
          {section?.render({ record, formConfig, activeStep, next, back })}
        </div>
        <Overridable
          id={`OarepoUI.TabContent.${section?.key}`}
          activeStep={activeStep}
          section={section}
          next={next}
          back={back}
        />
      </ErrorBoundary>
      <div className="tab-content-navigation">
        {activeStep > 0 && (
          <Button
            className="tab-content-navigation-button back-button"
            icon
            labelPosition="left"
            type="button"
            onClick={back}
          >
            <Icon name="arrow left" />
            {previousStepLabel || i18next.t("Back")}
          </Button>
        )}
        {activeStep < sections.length - 1 && (
          <Button
            className="tab-content-navigation-button next-button"
            icon
            labelPosition="right"
            type="button"
            onClick={next}
          >
            {nextStepLabel || i18next.t("Next")}
            <Icon name="arrow right" />
          </Button>
        )}
      </div>
    </Segment>
  );
};

TabContent.propTypes = {
  activeStep: PropTypes.number.isRequired,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      includesPaths: PropTypes.array,
      /** render({ record, formConfig, activeStep }) => ReactNode */
      render: PropTypes.func.isRequired,
    }),
  ).isRequired,
  next: PropTypes.func.isRequired,
  back: PropTypes.func.isRequired,
};

export default TabContent;
