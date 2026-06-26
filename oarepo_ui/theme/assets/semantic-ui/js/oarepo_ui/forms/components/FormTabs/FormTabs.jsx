import React from "react";
import PropTypes from "prop-types";
import { Menu, Icon } from "semantic-ui-react";
import { FormTabErrors } from "../FormTabErrors";
import { SectionCompletionBar } from "../SectionCompletionBar";
import { useFormNavigation } from "../../hooks";

export const FormTabs = ({
  sections,
  activeStep,
  onTabChange,
  tabsLocked = false,
}) => {
  const { hasBeenSavedInSession, isActive, handleClick, handleKeyDown } =
    useFormNavigation({
      activeStep,
      onTabChange,
    });

  return (
    <Menu
      className="form form-tabs"
      fluid
      vertical
      tabular
      role="tablist"
      data-testid="form-tabs"
    >
      {sections.map((section, index) => (
        <Menu.Item
          id={`form-tab-${section.key}`}
          as="a"
          key={section.key}
          onClick={() => handleClick(index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          active={isActive(index)}
          disabled={tabsLocked && !isActive(index)}
          role="tab"
          aria-selected={isActive(index)}
          tabIndex={isActive(index) ? 0 : -1}
          data-testid={`form-tab-${section.key}`}
        >
          <div className="flex align-items-center ">
            {hasBeenSavedInSession && (
              <FormTabErrors includesPaths={section.includesPaths || []} />
            )}
            <span className="rel-ml-1">{section.label}</span>
          </div>
          <div>
            <Icon name="chevron right" />
          </div>
          <SectionCompletionBar
            includesPaths={section.includesPaths || []}
            sectionCompletion={section.sectionCompletion}
            sectionCompletionThreshold={section.sectionCompletionThreshold}
          />
        </Menu.Item>
      ))}
    </Menu>
  );
};

FormTabs.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      includesPaths: PropTypes.array,
      saveOnTabChange: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
      sectionCompletion: PropTypes.func,
      sectionCompletionThreshold: PropTypes.number,
      /** (formik, reduxState) => boolean — when truthy on the active section, tab navigation is blocked. */
      lockTabChange: PropTypes.func,
      /** component({ record, formConfig, activeStep, next, back, initialRecord }) => ReactNode */
      component: PropTypes.func.isRequired,
    })
  ),
  activeStep: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
  tabsLocked: PropTypes.bool,
};

export default FormTabs;
