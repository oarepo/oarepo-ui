import React from "react";
import { useFormikContext, getIn } from "formik";
import { Label } from "semantic-ui-react";
import { useFieldData } from "@js/oarepo_ui";
import PropTypes from "prop-types";
// getfielddata must only be called on top level of component because it uses useMemo
const ErrorMessageItem = ({ error }) => {
  const { getFieldData } = useFieldData();
  const label = getFieldData({
    fieldPath: error.errorPath,
    fieldRepresentation: "text",
  })?.label;

  return `${label}: ${error.errorMessage}`;
};

export const NestedErrors = ({ fieldPath }) => {
  const { errors } = useFormikContext();
  const beValidationErrors = getIn(errors, "BEvalidationErrors", {});
  const nestedErrorPaths = beValidationErrors?.errorPaths?.filter((errorPath) =>
    errorPath.startsWith(fieldPath)
  );

  const nestedErrors = nestedErrorPaths?.map((errorPath) => {
    return {
      errorMessage: getIn(errors, errorPath, ""),
      errorPath,
    };
  });

  return (
    nestedErrors?.length > 0 && (
      <React.Fragment>
        <Label className="rel-mb-1 mt-0" prompt pointing="above">
          {nestedErrors.map((nestedError, index) => (
            <p key={nestedError.errorPath}>
              <ErrorMessageItem error={nestedError} />
            </p>
          ))}
        </Label>
        <br />
      </React.Fragment>
    )
  );
};

NestedErrors.propTypes = {
  fieldPath: PropTypes.string.isRequired,
};
