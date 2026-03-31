import React from "react";
import PropTypes from "prop-types";
import { Progress } from "semantic-ui-react";
import { useFormikContext, getIn } from "formik";
import { useSelector } from "react-redux";

const isFilled = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.values(value).some(isFilled);
  return true;
};

export const FormProgress = ({ requiredFields = [] }) => {
  const { values } = useFormikContext();
  const filesEntries = useSelector((state) => state.files?.entries);
  const filesEnabled = useSelector(
    (state) => state.deposit.record?.files?.enabled,
  );

  const total = requiredFields.length + (filesEnabled ? 1 : 0);

  const filledMetadata = requiredFields.filter((path) =>
    isFilled(getIn(values, path)),
  ).length;

  const hasFiles = Object.values(filesEntries || {}).some(
    (f) => f.progressPercentage === 100,
  );
  const filledFiles = filesEnabled && hasFiles ? 1 : 0;

  const filled = filledMetadata + filledFiles;
  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;

  const progressStyle = { height: "0.5rem" };

  if (percent === 0) {
    return (
      <div className="ui tiny progress form-progress" style={progressStyle} />
    );
  }

  return (
    <Progress
      percent={percent}
      size="tiny"
      color="yellow"
      className="form-progress"
      style={progressStyle}
    />
  );
};

FormProgress.propTypes = {
  requiredFields: PropTypes.arrayOf(PropTypes.string),
};
