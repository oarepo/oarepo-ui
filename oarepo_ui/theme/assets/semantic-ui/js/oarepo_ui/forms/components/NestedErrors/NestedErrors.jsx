import React from "react";
import { useFormikContext, getIn } from "formik";
import { Label } from "semantic-ui-react";
import { useFieldData } from "../../hooks";
import PropTypes from "prop-types";
import { collectNestedErrors } from "../../../util";
import _isEqual from "lodash/isEqual";

// getfielddata must only be called on top level of component because it uses useMemo
const ErrorMessageItem = ({ error }) => {
  const { getFieldData } = useFieldData();
  const label = getFieldData({
    fieldPath: error.errorPath,
    fieldRepresentation: "text",
    ignorePrefix: true,
  })?.label;

  return `${label}: ${error.errorMessage}`;
};

export const NestedErrors = ({ fieldPath }) => {
  const { errors, initialErrors, values, initialValues } = useFormikContext();

  const liveError = getIn(errors, fieldPath);
  const untouched = _isEqual(
    getIn(values, fieldPath),
    getIn(initialValues, fieldPath)
  );
  const fieldErrors =
    liveError ?? (untouched ? getIn(initialErrors, fieldPath) : undefined);

  const nestedErrors = fieldErrors
    ? collectNestedErrors(fieldErrors, fieldPath)
    : [];

  return (
    nestedErrors?.length > 0 && (
      <React.Fragment>
        <Label className="rel-mb-1 mt-0" prompt pointing="above">
          {nestedErrors.map((nestedError) => (
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
