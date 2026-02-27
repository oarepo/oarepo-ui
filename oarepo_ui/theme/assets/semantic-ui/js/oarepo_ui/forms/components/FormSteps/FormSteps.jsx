import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Step } from "semantic-ui-react";
import { FormTabErrors } from "../FormTabErrors";
import { useFormNavigation } from "../../hooks";

export const FormSteps = ({ sections, activeStep, onTabChange }) => {
  const scrollContainerRef = useRef(null);
  const { hasBeenSavedInSession, isActive, handleClick, handleKeyDown } =
    useFormNavigation({
      activeStep,
      onTabChange,
      sectionsCount: sections.length,
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
    <div className="form-steps-container" ref={scrollContainerRef}>
      <Step.Group fluid size="mini" unstackable role="tablist">
        {sections.map((section, index) => (
          <Step
            id={section.key}
            key={section.key}
            active={isActive(index)}
            completed={index < activeStep}
            onClick={() => handleClick(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            link
            role="tab"
            aria-selected={isActive(index)}
            tabIndex={isActive(index) ? 0 : -1}
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
    }),
  ).isRequired,
  activeStep: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
};

export default FormSteps;
