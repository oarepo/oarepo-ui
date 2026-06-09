import React, { useRef, useEffect } from "react";
import { Segment, Button, Icon, Message } from "semantic-ui-react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { i18next } from "@translations/oarepo_ui/i18next";
import Overridable from "react-overridable";
import { ErrorBoundary } from "react-error-boundary";
import { useFormikContext } from "formik";
import { useInitialRecord, useFormConfig } from "../../hooks";
import { buildUID } from "react-searchkit";
import { FormFeedbackPanel } from "../FormFeedback";

const TabErrorFallback = ({ error, resetErrorBoundary }) => (
  <Message negative icon data-testid="tab-error-fallback">
    <Icon name="exclamation triangle" />
    <Message.Content>
      <Message.Header>
        {i18next.t("Something went wrong in this section")}
      </Message.Header>
      <p>{error?.message}</p>
      <Button
        basic
        color="red"
        size="small"
        onClick={resetErrorBoundary}
        data-testid="tab-error-retry-button"
      >
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

  const { dirty } = useFormikContext();
  const { initialRecord } = useInitialRecord();

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

  if (!section) {
    return (
      <Message negative data-testid="tab-content-no-section">
        <Message.Header>
          {i18next.t("This section is not defined.")}
        </Message.Header>
      </Message>
    );
  }

  if (!section.component) {
    return (
      <Message negative data-testid="tab-content-no-component">
        <Message.Header>
          {i18next.t(
            "Section definition is missing the component key and it must be defined."
          )}
        </Message.Header>
      </Message>
    );
  }

  const SectionComponent = section.component;

  return (
    <Segment
      className="tab-content borderless shadowless"
      data-testid="tab-content"
    >
      <Overridable
        id={buildUID(
          formConfig?.overridableIdPrefix,
          "TabForm.TabContent.FormFeedbackPanel"
        )}
        sections={sections}
      >
        <FormFeedbackPanel sections={sections} />
      </Overridable>
      <ErrorBoundary
        FallbackComponent={TabErrorFallback}
        resetKeys={[section.key]}
      >
        <div
          className="tab-content-body"
          ref={contentRef}
          tabIndex={-1}
          role="tabpanel"
          aria-labelledby={section.key}
          data-testid={`tab-content-body-${section.key}`}
        >
          <SectionComponent
            record={record}
            formConfig={formConfig}
            activeStep={activeStep}
            next={next}
            back={back}
            initialRecord={initialRecord}
          />
        </div>
        {dirty && (
          <Message info data-testid="unsaved-changes-message">
            <Message.Content>
              <Icon name="info circle" />
              {i18next.t("Your draft contains unsaved changes.")}
            </Message.Content>
          </Message>
        )}
        <Overridable
          id={buildUID(
            formConfig?.overridableIdPrefix,
            `TabForm.TabContent.${section.key}`
          )}
          activeStep={activeStep}
          section={section}
          next={next}
          back={back}
        />
      </ErrorBoundary>
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
      saveOnTabChange: PropTypes.bool,
      sectionCompletion: PropTypes.func,
      sectionCompletionThreshold: PropTypes.number,
      /** component({ record, formConfig, activeStep, next, back, initialRecord }) => ReactNode */
      component: PropTypes.func.isRequired,
    })
  ),
  next: PropTypes.func.isRequired,
  back: PropTypes.func.isRequired,
};

export default TabContent;
