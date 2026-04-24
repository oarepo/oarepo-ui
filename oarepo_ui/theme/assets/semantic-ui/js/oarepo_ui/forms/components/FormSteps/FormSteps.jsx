import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Step, Popup } from "semantic-ui-react";
import { useFormikContext } from "formik";
import { FormTabErrors } from "../FormTabErrors";
import { useFormNavigation } from "../../hooks";

const FormStepItem = ({
  section,
  index,
  isActive,
  hasBeenSavedInSession,
  handleClick,
  handleKeyDown,
  activeStep,
}) => {
  const { values } = useFormikContext();
  const summaryContent = section.summary?.(values);

  const step = (
    <Step
      id={`form-step-${section.key}`}
      active={isActive(index)}
      completed={index < activeStep}
      onClick={() => handleClick(index)}
      onKeyDown={(event) => handleKeyDown(event, index)}
      link
      role="tab"
      aria-selected={isActive(index)}
      tabIndex={isActive(index) ? 0 : -1}
      data-testid={`form-step-${section.key}`}
    >
      <Step.Content>
        <Step.Title>
          {hasBeenSavedInSession && (
            <FormTabErrors includesPaths={section.includesPaths || []} />
          )}
          {section.label}
        </Step.Title>
      </Step.Content>
    </Step>
  );

  if (!summaryContent) return step;

  return (
    <Popup
      trigger={step}
      content={summaryContent}
      position="bottom center"
      size="small"
      mouseEnterDelay={300}
    />
  );
};

FormStepItem.propTypes = {
  section: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    includesPaths: PropTypes.array,
    summary: PropTypes.func,
  }).isRequired,
  index: PropTypes.number.isRequired,
  isActive: PropTypes.func.isRequired,
  hasBeenSavedInSession: PropTypes.bool.isRequired,
  handleClick: PropTypes.func.isRequired,
  handleKeyDown: PropTypes.func.isRequired,
  activeStep: PropTypes.number.isRequired,
};

export const FormSteps = ({ sections, activeStep, onTabChange }) => {
  const scrollContainerRef = useRef(null);
  const { hasBeenSavedInSession, isActive, handleClick, handleKeyDown } =
    useFormNavigation({
      activeStep,
      onTabChange,
    });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const steps = container.querySelectorAll(".step");
    const activeStepEl = steps[activeStep];
    if (activeStepEl) {
      const containerRect = container.getBoundingClientRect();
      const stepRect = activeStepEl.getBoundingClientRect();
      const scrollLeft =
        stepRect.left -
        containerRect.left +
        container.scrollLeft -
        containerRect.width / 2 +
        stepRect.width / 2;

      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeStep]);

  return (
    <div
      className="form-steps-container"
      ref={scrollContainerRef}
      data-testid="form-steps-container"
    >
      <Step.Group
        fluid
        size="mini"
        unstackable
        role="tablist"
        data-testid="form-steps"
      >
        {sections.map((section, index) => (
          <FormStepItem
            key={section.key}
            section={section}
            index={index}
            isActive={isActive}
            hasBeenSavedInSession={hasBeenSavedInSession}
            handleClick={handleClick}
            handleKeyDown={handleKeyDown}
            activeStep={activeStep}
          />
        ))}
      </Step.Group>
    </div>
  );
};

FormSteps.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      includesPaths: PropTypes.array,
      saveOnTabChange: PropTypes.bool,
      /** (values) => string|ReactNode|null — optional summary shown in a tooltip on hover */
      summary: PropTypes.func,
      /** component({ record, formConfig, activeStep, next, back, initialRecord }) => ReactNode */
      component: PropTypes.func.isRequired,
    })
  ),
  activeStep: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
};

export default FormSteps;
