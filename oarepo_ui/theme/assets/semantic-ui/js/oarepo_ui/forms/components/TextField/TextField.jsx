import React from "react";
import { TextField as InvenioTextField } from "react-invenio-forms";
import { useFieldData, useSanitizeInput } from "../../hooks";
import { getIn, useFormikContext } from "formik";
import PropTypes from "prop-types";
import { mergeFieldData } from "../../util";

export const TextField = ({
  fieldPath,
  fieldRepresentation = "full",
  icon = "",
  label,
  required,
  helpText,
  placeholder,
  ...rest
}) => {
  const { sanitizeInput } = useSanitizeInput();
  const { setFieldTouched, setFieldValue, values } = useFormikContext();
  const { getFieldData } = useFieldData();

  const fieldDataProps = mergeFieldData(
    getFieldData({ fieldPath, fieldRepresentation, icon }),
    { label, required, helpText, placeholder }
  );

  return (
    <InvenioTextField
      optimized
      fieldPath={fieldPath}
      {...fieldDataProps}
      onBlur={() => {
        const cleanedContent = sanitizeInput(getIn(values, fieldPath));
        setFieldValue(fieldPath, cleanedContent);
        setFieldTouched(fieldPath, true);
      }}
      {...rest}
    />
  );
};

TextField.propTypes = {
  fieldPath: PropTypes.string.isRequired,
  /* eslint-disable react/require-default-props */
  fieldRepresentation: PropTypes.string,
  icon: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  required: PropTypes.bool,
  helpText: PropTypes.string,
  placeholder: PropTypes.string,
  /* eslint-enable react/require-default-props */
};
