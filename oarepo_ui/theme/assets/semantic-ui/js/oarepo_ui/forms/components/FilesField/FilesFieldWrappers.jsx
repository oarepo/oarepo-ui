import React from "react";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import FileManagementDialog from "@oarepo/file-manager";

export const FileUploadWrapper = ({
  uploadWrapperClassName = "ui container centered",
  uploadButtonClassName = "ui button icon left labeled files-upload-button",
  props = {},
  required = false,
}) => {
  const TriggerComponent = ({ onClick = () => {}, ...props }) => (
    <button
      className={uploadButtonClassName}
      onClick={onClick}
      type="button"
      aria-label={i18next.t("Upload files")}
      {...props}
    >
      {i18next.t("Upload files")} {required && <span>*</span>}
      <i aria-hidden="true" className="upload icon" />
    </button>
  );

  TriggerComponent.propTypes = {
    // eslint-disable-next-line react/require-default-props
    onClick: PropTypes.func,
  };

  return (
    <div className={uploadWrapperClassName}>
      <FileManagementDialog TriggerComponent={TriggerComponent} {...props} />
    </div>
  );
};

FileUploadWrapper.propTypes = {
  /* eslint-disable react/require-default-props */
  uploadWrapperClassName: PropTypes.string,
  uploadButtonClassName: PropTypes.string,
  required: PropTypes.bool,
  props: PropTypes.object,
  /* eslint-enable react/require-default-props */
};

export const FileEditWrapper = ({
  editWrapperClassName = "",
  editButtonClassName = "ui button transparent",
  props = {},
}) => {
  const TriggerComponent = ({ onClick, ...props }) => {
    return (
      <button
        className={editButtonClassName}
        onClick={onClick}
        {...props}
        aria-label={i18next.t("Edit file")}
        type="button"
      >
        <i
          aria-hidden="true"
          className="pencil icon"
          style={{ margin: "0", opacity: "1" }}
        />
      </button>
    );
  };

  TriggerComponent.propTypes = {
    // eslint-disable-next-line react/require-default-props
    onClick: PropTypes.func,
  };

  return (
    <div className={editWrapperClassName}>
      <FileManagementDialog TriggerComponent={TriggerComponent} {...props} />
    </div>
  );
};

/* eslint-disable react/require-default-props */
FileEditWrapper.propTypes = {
  editWrapperClassName: PropTypes.string,
  editButtonClassName: PropTypes.string,
  props: PropTypes.object,
};
/* eslint-enable react/require-default-props */
