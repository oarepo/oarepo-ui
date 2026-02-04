import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Step } from "semantic-ui-react";
import { FormTabErrors } from "../FormTabErrors";
import { connect } from "react-redux";

const FormStepsComponent = ({
  sections,
  activeStep,
  onTabChange,
  hasBeenSavedInSession,
}) => {
  const scrollContainerRef = useRef(null);

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

  const handleKeyDown = (event, index) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (index !== activeStep) {
        onTabChange(index);
      }
    }
  };

  return (
    <div ref={scrollContainerRef} style={{ overflowX: "auto" }}>
      <Step.Group fluid size="mini" unstackable role="tablist">
        {sections.map((section, index) => {
          const isActive = activeStep === index;
          return (
            <Step
              key={section.key}
              active={isActive}
              completed={index < activeStep}
              onClick={() => {
                if (!isActive) onTabChange(index);
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              link
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
            >
              <Step.Content>
                <Step.Title>
                  {hasBeenSavedInSession && (
                    <FormTabErrors includesPaths={section.includedPaths} />
                  )}
                  {section.label}
                </Step.Title>
              </Step.Content>
            </Step>
          );
        })}
      </Step.Group>
    </div>
  );
};

FormStepsComponent.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      includedPaths: PropTypes.array,
    }),
  ).isRequired,
  activeStep: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
  hasBeenSavedInSession: PropTypes.bool,
};

FormStepsComponent.defaultProps = {
  hasBeenSavedInSession: false,
};

const mapStateToProps = (state) => ({
  hasBeenSavedInSession: state.deposit.hasBeenSavedInSession,
});

export const FormSteps = connect(mapStateToProps, null)(FormStepsComponent);
export default FormSteps;
