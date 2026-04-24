import React from "react";
import PropTypes from "prop-types";
import { Menu, Icon, Popup } from "semantic-ui-react";
import { useFormikContext } from "formik";
import { FormTabErrors } from "../FormTabErrors";
import { useFormNavigation } from "../../hooks";

const FormTabItem = ({
  section,
  index,
  isActive,
  hasBeenSavedInSession,
  handleClick,
  handleKeyDown,
}) => {
  const { values } = useFormikContext();
  const summaryContent = section.summary?.(values);

  const menuItem = (
    <Menu.Item
      id={`form-tab-${section.key}`}
      as="a"
      onClick={() => handleClick(index)}
      onKeyDown={(event) => handleKeyDown(event, index)}
      active={isActive(index)}
      role="tab"
      aria-selected={isActive(index)}
      tabIndex={isActive(index) ? 0 : -1}
      data-testid={`form-tab-${section.key}`}
    >
      <div className="flex">
        {hasBeenSavedInSession && (
          <FormTabErrors includesPaths={section.includesPaths || []} />
        )}
        {section.label}
      </div>
      <div>
        <Icon name="chevron right" />
      </div>
    </Menu.Item>
  );

  if (!summaryContent) return menuItem;

  return (
    <Popup
      trigger={menuItem}
      content={summaryContent}
      position="right center"
      size="small"
      mouseEnterDelay={300}
    />
  );
};

FormTabItem.propTypes = {
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
};

export const FormTabs = ({ sections, activeStep, onTabChange }) => {
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
        <FormTabItem
          key={section.key}
          section={section}
          index={index}
          isActive={isActive}
          hasBeenSavedInSession={hasBeenSavedInSession}
          handleClick={handleClick}
          handleKeyDown={handleKeyDown}
        />
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

export default FormTabs;
