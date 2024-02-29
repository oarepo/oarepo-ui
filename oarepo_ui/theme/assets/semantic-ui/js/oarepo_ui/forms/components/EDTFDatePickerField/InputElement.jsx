import React, { forwardRef } from "react";
import { Form, Icon } from "semantic-ui-react";
import { useFormikContext, getIn } from "formik";
import PropTypes from "prop-types";

export const InputElement = forwardRef(
  (
    {
      fieldPath,
      onClick,
      value,
      label,
      placeholder,
      className,
      clearButtonClassName,
      handleClear,
    },
    ref
  ) => {
    const { errors } = useFormikContext();
    const inputError = getIn(errors, fieldPath, "");
    return (
      <Form.Input
        // need to explicitly set it as undefined, because otherwise it shows empty errors
        // attached to the input
        error={inputError ? inputError : undefined}
        onClick={onClick}
        label={label}
        value={value}
        placeholder={placeholder}
        className={className}
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

InputElement.propTypes = {
  value: PropTypes.string,
  onClick: PropTypes.func,
  clearButtonClassName: PropTypes.string,
  handleClear: PropTypes.func,
  fieldPath: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
  placeholder: PropTypes.string,
};

InputElement.defaultProps = {
  clearButtonClassName: "clear-icon",
};
