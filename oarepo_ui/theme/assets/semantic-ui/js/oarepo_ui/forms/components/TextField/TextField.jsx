import React from "react";
import { TextField as InvenioTextField } from "react-invenio-forms";
import { useFieldData, useSanitizeInput } from "../../hooks";
import { getIn, useFormikContext } from "formik";
import PropTypes from "prop-types";

export const TextField = ({
  fieldPath,
  fieldRepresentation = "full",
  icon,
  ...rest
}) => {
  const { sanitizeInput } = useSanitizeInput();
  const { setFieldTouched, setFieldValue, values } = useFormikContext();
  const { getFieldData } = useFieldData();

  return (
    <InvenioTextField
      optimized
      fieldPath={fieldPath}
      {...getFieldData({ fieldPath, fieldRepresentation, icon })}
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
  fieldRepresentation: PropTypes.string,
  icon: PropTypes.string,
};
