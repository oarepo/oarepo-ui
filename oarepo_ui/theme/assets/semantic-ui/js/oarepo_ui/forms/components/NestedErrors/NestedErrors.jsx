import React from "react";
import { useFormikContext, getIn } from "formik";
import { Label } from "semantic-ui-react";
import { useFieldData } from "@js/oarepo_ui";
import PropTypes from "prop-types";

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
  const { getFieldData } = useFieldData();

  return (
    nestedErrors?.length > 0 && (
      <React.Fragment>
        <Label className="rel-mb-1 mt-0" prompt pointing="above">
          {nestedErrors.map(({ errorMessage, errorPath }, index) => (
            <p key={errorPath}>{`${
              getFieldData({
                fieldPath: errorPath,
                fieldRepresentation: "text",
                ignorePrefix: true,
              }).label
            }: ${errorMessage}`}</p>
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
