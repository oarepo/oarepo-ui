import React, { useRef } from "react";
import PropTypes from "prop-types";
import { Menu, Icon } from "semantic-ui-react";
import { FormTabErrors } from "../FormTabErrors";
import { useFormNavigation } from "../../hooks";

export const FormTabs = ({ sections, activeStep, onTabChange }) => {
  const menuRef = useRef(null);
  const { hasBeenSavedInSession, isActive, handleClick, handleKeyDown } =
    useFormNavigation({
      activeStep,
      onTabChange,
      sectionsCount: sections.length,
    });

  return (
    <Menu
      className="form form-tabs"
      fluid
      vertical
      tabular
      role="tablist"
      ref={menuRef}
    >
      {sections.map((section, index) => (
        <Menu.Item
          as="a"
          key={section.key}
          onClick={() => handleClick(index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          active={isActive(index)}
          role="tab"
          aria-selected={isActive(index)}
          tabIndex={isActive(index) ? 0 : -1}
        >
          <div className="flex">
            {hasBeenSavedInSession && (
              <FormTabErrors includesPaths={section.includesPaths} />
            )}
            {section.label}
          </div>
          <div>
            <Icon name="chevron right" />
          </div>
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
    }),
  ).isRequired,
  activeStep: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
};

export default FormTabs;
