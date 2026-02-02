import React from "react";
import PropTypes from "prop-types";
import { Menu, Icon } from "semantic-ui-react";
import { FormTabErrors } from "../FormTabErrors";
import { connect } from "react-redux";

const FormTabsComponent = ({
  sections,
  activeStep,
  onTabChange,
  hasBeenSavedInSession,
}) => {
  return (
    <Menu className="form form-tabs" fluid vertical tabular>
      {sections.map((section, index) => (
        <Menu.Item
          key={section.key}
          onClick={() => {
            if (activeStep === index) return;
            onTabChange(index);
          }}
          active={activeStep === index}
          className="flex"
          style={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <div className="flex">
            {hasBeenSavedInSession && (
              <FormTabErrors includesPaths={section.includedPaths} />
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

FormTabsComponent.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      includedPaths: PropTypes.array,
    })
  ).isRequired,
  activeStep: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
  hasBeenSavedInSession: PropTypes.bool,
};

FormTabsComponent.defaultProps = {
  hasBeenSavedInSession: false,
};

const mapStateToProps = (state) => {
  return {
    hasBeenSavedInSession: state.deposit.hasBeenSavedInSession,
  };
};
export const FormTabs = connect(mapStateToProps, null)(FormTabsComponent);
export default FormTabs;
