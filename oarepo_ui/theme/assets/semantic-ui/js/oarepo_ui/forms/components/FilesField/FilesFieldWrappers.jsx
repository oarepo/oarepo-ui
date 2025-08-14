import React from "react";
import PropTypes from "prop-types";
import { i18next } from "@translations/oarepo_ui/i18next";
import FileManagementDialog from "@oarepo/file-manager";

const UploadTriggerButton = React.memo(
  ({
    onClick,
    className = "",
    icon = "upload",
    label = i18next.t("Upload files"),
    showLabel = true,
    required = false,
    ...props
  }) => (
    <button
      className={className}
      onClick={onClick}
      type="button"
      aria-label={label}
      {...props}
    >
      showLabel && ({i18next.t("Upload files")} {required && <span>*</span>})
      <i
        aria-hidden="true"
        className={`${icon} icon`}
        style={{ margin: "0", opacity: "1" }}
      />
    </button>
  )
);

UploadTriggerButton.displayName = "UploadTriggerButton";
UploadTriggerButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  /* eslint-disable react/require-default-props */
  className: PropTypes.string,
  required: PropTypes.bool,
  showLabel: PropTypes.bool,
  icon: PropTypes.string,
  label: PropTypes.string,
  /* eslint-enable react/require-default-props */
};

export class FileUploadWrapper extends React.Component {
  constructor(props) {
    super(props);
    // eslint-disable-next-line react/display-name
    this.Trigger = (triggerProps) => (
      <UploadTriggerButton
        {...triggerProps}
        className={props.uploadButtonClassName}
        required={props.required}
      />
    );
  }

  render() {
    const { uploadWrapperClassName, ...props } = this.props;
    return (
      <div className={uploadWrapperClassName}>
        <FileManagementDialog TriggerComponent={this.Trigger} {...props} />
      </div>
    );
  }
}

FileUploadWrapper.propTypes = {
  /* eslint-disable react/require-default-props */
  uploadWrapperClassName: PropTypes.string,
  uploadButtonClassName: PropTypes.string,
  required: PropTypes.bool,
  props: PropTypes.object,
  /* eslint-enable react/require-default-props */
};

export class FileEditWrapper extends React.Component {
  constructor(props) {
    super(props);
    // eslint-disable-next-line react/display-name
    this.Trigger = (triggerProps) => (
      <UploadTriggerButton
        {...triggerProps}
        className={props.editButtonClassName}
        showLabel={false}
        label={i18next.t("Edit file")}
        icon="pencil"
      />
    );
  }

  render() {
    const { editWrapperClassName, ...props } = this.props;
    return (
      <div className={editWrapperClassName}>
        <FileManagementDialog
          TriggerComponent={this.TriggerComponent}
          {...props}
        />
      </div>
    );
  }
}

/* eslint-disable react/require-default-props */
FileEditWrapper.propTypes = {
  editWrapperClassName: PropTypes.string,
  editButtonClassName: PropTypes.string,
  props: PropTypes.object,
};
/* eslint-enable react/require-default-props */
