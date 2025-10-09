import _get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import React from "react";
import PropTypes from "prop-types";
import { Label, Icon } from "semantic-ui-react";
import { useFormikContext } from "formik";
import { connect } from "react-redux";
import { DRAFT_SAVE_STARTED } from "@js/invenio_rdm_records/src/deposit/state/types";
import { SAVE_CANCELLED } from "../../state/deposit/types";

function findErrorObjects(obj) {
  const results = [];
  function traverse(current) {
    if (typeof current !== "object" || current === null) return;
    if ("message" in current && "severity" in current) results.push(current);
    for (const key of Object.keys(current)) {
      traverse(current[key]);
    }
  }
  traverse(obj);
  return results;
}

function getSubfieldErrors(errors, initialErrors, includesPaths) {
  const subfieldErrors = [];
  for (const fieldPath of includesPaths) {
    const err = _get(errors, fieldPath) || _get(initialErrors, fieldPath);
    if (err) {
      if (typeof err === "object") {
        const errs = findErrorObjects(err);
        subfieldErrors.push(...errs);
      } else {
        subfieldErrors.push(err);
      }
    }
  }
  return subfieldErrors;
}

function categorizeErrors(errors) {
  const categories = { info: [], warning: [], error: [] };
  for (const err of errors) {
    if (!Object.hasOwn(err, "severity")) {
      categories.error.push(err);
    } else {
      categories[`${err.severity}`].push(err);
    }
  }
  return categories;
}

const FormTabErrorsComponent = ({ includesPaths, actionState }) => {
  const { errors, initialErrors, isSubmitting } = useFormikContext();

  const subfieldErrors = getSubfieldErrors(
    errors,
    initialErrors,
    includesPaths
  );
  const categorizedErrors = categorizeErrors(subfieldErrors);
  const noMessages = Object.values(categorizedErrors).every(isEmpty);
  if (
    isSubmitting ||
    actionState === DRAFT_SAVE_STARTED ||
    actionState === SAVE_CANCELLED
  ) {
    return <Icon loading name="circle notch" />;
  }

  if (noMessages) {
    return <Icon name="check" color="green" />;
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

const mapStateToProps = (state) => {
  return {
    actionState: state.deposit.actionState,
  };
};

export default connect(mapStateToProps, null)(FormTabErrorsComponent);

export const FormTabErrors = connect(
  mapStateToProps,
  null
)(FormTabErrorsComponent);

FormTabErrorsComponent.propTypes = {
  includesPaths: PropTypes.array.isRequired,
  actionState: PropTypes.string,
};
