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
      onKeyDown,
      autoComplete,
    },
    ref
  ) => {
    const { errors } = useFormikContext();
    const inputError = getIn(errors, fieldPath, undefined);
    return (
      <Form.Input
        error={inputError}
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

InputElement.defaultProps = {
  clearButtonClassName: "clear-icon",
};
