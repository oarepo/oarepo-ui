import React from "react";
import { Segment, Button, Icon } from "semantic-ui-react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useFormConfig } from "../../hooks";
import { i18next } from "@translations/oarepo_ui/i18next";

export const TabContentComponent = ({
  activeStep,
  sections,
  record,
  next,
  back,
}) => {
  const formConfig = useFormConfig();
  const section = sections[activeStep];
  return (
    <Segment
      style={{
        minHeight: "80vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
      className="borderless shadowless"
    >
      <div style={{ flex: 1 }}>{section?.render(record, formConfig)}</div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          paddingTop: "20px",
        }}
      >
        {activeStep > 0 && (
          <Button icon labelPosition="left" type="button" onClick={back}>
            <Icon name="arrow left" />
            {i18next.t("Back")}
          </Button>
        )}
        {activeStep < sections.length - 1 && (
          <Button icon labelPosition="right" type="button" onClick={next}>
            {i18next.t("Next")}
            <Icon name="arrow right" />
          </Button>
        )}
      </div>
    </Segment>
  );
};

const mapStateToProps = (state) => {
  return {
    record: state.deposit.record,
  };
};

export const TabContent = connect(mapStateToProps, null)(TabContentComponent);

TabContentComponent.propTypes = {
  activeStep: PropTypes.number.isRequired,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      includedPaths: PropTypes.array,
      render: PropTypes.func.isRequired,
    })
  ).isRequired,
  next: PropTypes.func.isRequired,
  back: PropTypes.func.isRequired,
  //redux
  record: PropTypes.object.isRequired,
};
