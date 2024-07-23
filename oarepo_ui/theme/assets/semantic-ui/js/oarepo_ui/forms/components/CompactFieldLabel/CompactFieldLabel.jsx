import React, { Component } from "react";
import PropTypes from "prop-types";
import { Icon, Popup } from "semantic-ui-react";

export class CompactFieldLabel extends Component {
  render() {
    const { htmlFor, icon, label, className, popupHelpText } = this.props;
    return (
      <label htmlFor={htmlFor} className={className}>
        {icon ? <Icon name={icon} /> : null}
        {label}
        {popupHelpText ? (
          <Popup
            position="top center"
            content={<span className="helptext">{popupHelpText}</span>}
            trigger={
              <Icon className="ml-5" name="question circle outline"></Icon>
            }
          />
        ) : null}
      </label>
    );
  }
}

CompactFieldLabel.propTypes = {
  htmlFor: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  icon: PropTypes.string,
  className: PropTypes.string,
  popupHelpText: PropTypes.string,
};

CompactFieldLabel.defaultProps = {
  className: "field-label-class compact-label",
  icon: "",
  htmlFor: undefined,
  label: undefined,
  popupHelpText: undefined,
};
