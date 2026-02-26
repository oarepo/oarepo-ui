import React, { useRef, useEffect } from "react";
import { Segment, Button, Icon, Message } from "semantic-ui-react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useFormConfig } from "../../hooks";
import { i18next } from "@translations/oarepo_ui/i18next";
import Overridable from "react-overridable";
import { ErrorBoundary } from "react-error-boundary";
import { useFormikContext } from "formik";

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
  const contentRef = useRef(null);
  const previousStepLabel =
    activeStep > 0 ? sections[activeStep - 1].label : null;
  const nextStepLabel =
    activeStep < sections.length - 1 ? sections[activeStep + 1].label : null;
  const { dirty } = useFormikContext();

  // Move focus to first focusable element in content when tab changes
  // When first input in a tab, is a dropdown, the behavior is not ideal i.e. it focuses and the dropdown extends
  // even when it has value. TODO: To discuss if this is really needed generally speaking.
  useEffect(() => {
    const focusableSelector =
      'input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href]';
    const firstFocusable = contentRef.current?.querySelector(focusableSelector);
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      // Fallback to container if no focusable elements
      contentRef.current?.focus();
    }
  }, [activeStep]);

  return (
    <Segment className="tab-content borderless shadowless">
      {dirty && (
        <Message info>
          <Message.Content>
            <Icon name="info circle" />
            {i18next.t("Your draft contains unsaved changes.")}
          </Message.Content>
        </Message>
      )}
      <ErrorBoundary
        FallbackComponent={TabErrorFallback}
        resetKeys={[section?.key]}
      >
        <div
          className="tab-content-body"
          ref={contentRef}
          tabIndex={-1}
          role="tabpanel"
          aria-labelledby={section?.key}
        >
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
