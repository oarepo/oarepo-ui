import isEmpty from "lodash/isEmpty";
import React from "react";
import PropTypes from "prop-types";
import { Label, Icon } from "semantic-ui-react";
import { useFormikContext } from "formik";
import { getSubfieldErrors, categorizeErrors } from "../../util";

export const FormTabErrors = ({ includesPaths }) => {
  const { errors, initialErrors, isSubmitting } = useFormikContext();

  const subfieldErrors = getSubfieldErrors(
    errors,
    initialErrors,
    includesPaths
  );
  const categorizedErrors = categorizeErrors(subfieldErrors);

  if (isSubmitting) {
    return <Icon loading name="circle notch" />;
  }

  return (
    <>
      {Object.entries(categorizedErrors).map(
        ([severity, messages]) =>
          !isEmpty(messages) && (
            <Label
              key={severity}
              size="mini"
              circular
              className={`tab-error ${severity} mr-5`}
            >
              {messages.length}
            </Label>
          )
      )}
    </>
  );
};

FormTabErrors.propTypes = {
  includesPaths: PropTypes.array.isRequired,
};

export default FormTabErrors;
