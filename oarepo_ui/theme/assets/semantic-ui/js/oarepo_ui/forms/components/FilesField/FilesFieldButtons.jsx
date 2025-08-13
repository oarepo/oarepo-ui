import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button, Icon } from "semantic-ui-react";
import { FileEditWrapper, FileUploadWrapper } from "./FilesFieldWrappers";
import { i18next } from "@translations/oarepo_ui/i18next";

let LOCALE;

if (i18next.language === "cs") {
  LOCALE = "cs_CZ";
} else if (i18next.language === "en") {
  LOCALE = "en_US";
} else {
  LOCALE = i18next.language;
}

export const EditFileButton = ({
  fileName,
  record,
  allowedFileTypes = ["*/*"],
}) => {
  return (
    <FileEditWrapper
      props={{
        config: { record: record },
        autoExtractImagesFromPDFs: false,
        locale: LOCALE,
        startEvent: { event: "edit-file", data: { file_key: fileName } },
        modifyExistingFiles: true,
        allowedFileTypes: allowedFileTypes,
      }}
    />
  );
};

EditFileButton.propTypes = {
  fileName: PropTypes.string.isRequired,
  record: PropTypes.object.isRequired,
  // eslint-disable-next-line react/require-default-props
  allowedFileTypes: PropTypes.array,
};

export const UploadFileButton = ({
  record,
  handleFilesUpload,
  allowedFileTypes = ["*/*"],
  fileMetadataFields = [],
  required = false,
}) => {
  return (
    <FileUploadWrapper
      props={{
        config: { record: record },
        autoExtractImagesFromPDFs: false,
        locale: LOCALE,
        allowedFileTypes: allowedFileTypes,
        startEvent: null,
        onCompletedUpload: (result) => {
          handleFilesUpload();
        },
        allowedMetaFields: fileMetadataFields,
      }}
      required={required}
    />
  );
};

UploadFileButton.propTypes = {
  record: PropTypes.object.isRequired,
  handleFilesUpload: PropTypes.func.isRequired,
  // eslint-disable-next-line react/require-default-props
  allowedFileTypes: PropTypes.array,
  // eslint-disable-next-line react/require-default-props
  required: PropTypes.bool,
  // eslint-disable-next-line react/require-default-props
  fileMetadataFields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      defaultValue: PropTypes.string,
      isUserInput: PropTypes.bool.isRequired,
    })
  ),
};

export const DeleteFileButton = ({ file, handleFileDeletion }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (file) => {
    setIsDeleting(true);
    try {
      await handleFileDeletion(file);
      setIsDeleting(false);
    } catch (error) {
      setIsDeleting(false);
      console.error(error);
    }
  };
  return isDeleting ? (
    <Icon loading name="spinner" />
  ) : (
    <Button
      disabled={isDeleting}
      className="transparent"
      type="button"
      onClick={() => handleDelete(file)}
      aria-label={i18next.t("Delete file")}
    >
      <Icon aria-hidden="true" name="trash alternate" className="m-0" />
    </Button>
  );
};

DeleteFileButton.propTypes = {
  file: PropTypes.object.isRequired,
  handleFileDeletion: PropTypes.func.isRequired,
};
