import React, { forwardRef } from "react";
import { Icon } from "semantic-ui-react";
import PropTypes from "prop-types";
import { TextField } from "react-invenio-forms";

export const InputElement = forwardRef(
  (
    {
      fieldPath,
      onClick,
      value,
      label,
      placeholder,
      className,
      clearButtonClassName = "clear-icon",
      handleClear,
      onKeyDown,
      autoComplete,
    },
    ref
  ) => {
    return (
      <TextField
        fieldPath={fieldPath}
        onClick={onClick}
        onKeyDown={onKeyDown}
        label={label}
        value={value}
        placeholder={placeholder}
        className={className}
        id={fieldPath}
        autoComplete={autoComplete}
        icon={
          value ? (
            <Icon
              className={clearButtonClassName}
              name="close"
              onClick={handleClear}
            />
          ) : null
        }
      />
    );
  }
);

InputElement.displayName = "InputElement";

/* eslint-disable react/require-default-props */
InputElement.propTypes = {
  value: PropTypes.string,
  onClick: PropTypes.func,
  clearButtonClassName: PropTypes.string,
  handleClear: PropTypes.func,
  fieldPath: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  onKeyDown: PropTypes.func,
  autoComplete: PropTypes.string,
};
/* eslint-enable react/require-default-props */
