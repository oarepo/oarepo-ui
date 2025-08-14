import React, { useState } from "react";
import { useFormikContext } from "formik";
import PropTypes from "prop-types";
import _isEmpty from "lodash/isEmpty";
import { i18next } from "@translations/oarepo_ui/i18next";
import { Message, Icon, Button, Dimmer, Loader } from "semantic-ui-react";
import { FilesFieldTable } from "./FilesFieldTable";
import { UploadFileButton } from "./FilesFieldButtons";
import { Trans } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { connect } from "react-redux";
import { deleteFile } from "@js/invenio_rdm_records/src/deposit/state/actions/files";
import { save } from "../../state/deposit/actions";
import { httpApplicationJson } from "../../../util";
import { useDepositFormAction, useFormConfig } from "../../hooks";

export const FilesFieldComponent = ({
  fileUploaderMessage = i18next.t(
    "After publishing the draft, it is not possible to add, modify or delete files. It will be necessary to create a new version of the record."
  ),
  record,
  allowedFileTypes = ["*/*"],
  fileMetadataFields = [],
  required = false,
  deleteFileAction,
  saveAction,
  files,
}) => {
  const [filesState, setFilesState] = useState(
    !_isEmpty(files) ? Object.values(files) : []
  );
  const { filesLocked } = useFormConfig();
  const { values } = useFormikContext();
  const recordObject = record || values;

  const isDraftRecord = !recordObject.is_published;
  const hasParentRecord =
    recordObject?.versions?.index && recordObject?.versions?.index > 1;

  const { handleAction: handleSave, isSubmitting } = useDepositFormAction({
    action: saveAction,
    params: { ignoreValidationErrors: true },
  });

  const displayImportBtn =
    recordObject?.files?.enabled &&
    isDraftRecord &&
    hasParentRecord &&
    !filesState.length;

  const {
    isError: isFileImportError,
    isLoading,
    mutate: importParentFiles,
    reset: resetImportParentFiles,
  } = useMutation({
    mutationFn: () =>
      httpApplicationJson.post(
        recordObject?.links?.self + "/actions/files-import",
        {}
      ),
    onSuccess: (data) => {
      setFilesState(data.data.entries);
      resetImportParentFiles();
    },
  });

  const { isFetching, isError, refetch } = useQuery(
    ["files"],
    () => httpApplicationJson.get(values.links.files),
    {
      refetchOnWindowFocus: false,
      enabled: false,
      onSuccess: (data) => {
        setFilesState(data?.data?.entries);
        resetImportParentFiles();
      },
    }
  );

  const handleFilesUpload = () => {
    refetch();
  };

  const handleFileDeletion = async (fileObject) => {
    try {
      await deleteFileAction(fileObject);
      setFilesState((prevFilesState) =>
        prevFilesState.filter((file) => file.key !== fileObject.key)
      );
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  if (!recordObject.id && recordObject?.files?.enabled) {
    return (
      <Message>
        <Icon name="info circle" className="text size large" />
        <Trans i18next={i18next}>
          <span>If you wish to upload files, you must </span>
          <Button
            className="ml-5 mr-5"
            primary
            onClick={() => handleSave()}
            loading={isSubmitting}
            disabled={isSubmitting}
            size="mini"
          >
            save
          </Button>
          <span> your draft first.</span>
        </Trans>
      </Message>
    );
  }

  if (recordObject.id && recordObject?.files?.enabled) {
    return (
      <Dimmer.Dimmable dimmed={isFetching}>
        <Dimmer active={isFetching || isLoading} inverted>
          <Loader indeterminate>{i18next.t("Fetching files")}...</Loader>
        </Dimmer>
        {isError ? (
          <Message negative>
            {i18next.t(
              "Failed to fetch draft's files. Please try refreshing the page."
            )}
          </Message>
        ) : (
          <React.Fragment>
            {displayImportBtn && (
              <Message className="flex justify-space-between align-items-center">
                <p className="mb-0">
                  <Icon name="info circle" />
                  {i18next.t("You can import files from the previous version.")}
                </p>
                <Button
                  type="button"
                  size="mini"
                  primary
                  onClick={() => importParentFiles()}
                  icon="sync"
                  content={i18next.t("Import files")}
                />
              </Message>
            )}
            {isFileImportError && (
              <Message negative>
                <Message.Content>
                  {i18next.t(
                    "Failed to import files from previous version. Please try again."
                  )}
                </Message.Content>
              </Message>
            )}
            <FilesFieldTable
              files={filesState}
              handleFileDeletion={handleFileDeletion}
              record={recordObject}
              allowedFileTypes={allowedFileTypes}
              lockFileUploader={filesLocked}
              fileMetadataFields={fileMetadataFields}
            />
            {/* filesLocked includes permission check as well. This is 
            so it does not display message when someone just does not have permissions to view */}
            {filesLocked && recordObject.is_published && (
              <Message className="flex justify-space-between align-items-center">
                <p className="mb-0">
                  <Icon name="info circle" />
                  <Trans i18next={i18next}>
                    You must create a new version to add, modify or delete
                    files. It can be done on record's{" "}
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={recordObject.links.self_html.replace(
                        "/preview",
                        ""
                      )}
                    >
                      detail
                    </a>{" "}
                    page.
                  </Trans>
                </p>
              </Message>
            )}
            {!filesLocked && (
              <UploadFileButton
                record={recordObject}
                handleFilesUpload={handleFilesUpload}
                allowedFileTypes={allowedFileTypes}
                lockFileUploader={filesLocked}
                allowedMetaFields={fileMetadataFields}
                required={required}
              />
            )}
          </React.Fragment>
        )}
        {!recordObject.is_published && (
          <Message
            negative
            className="flex justify-space-between align-items-center"
          >
            <p className="mb-0">
              <Icon name="warning sign" />
              {fileUploaderMessage}
            </p>
          </Message>
        )}
      </Dimmer.Dimmable>
    );
  }

  return null;
};

FilesFieldComponent.propTypes = {
  deleteFileAction: PropTypes.func.isRequired,
  saveAction: PropTypes.func.isRequired,
  files: PropTypes.array.isRequired,
  /* eslint-disable react/require-default-props */
  record: PropTypes.object,
  allowedFileTypes: PropTypes.array,
  fileUploaderMessage: PropTypes.string,
  required: PropTypes.bool,
  fileMetadataFields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      defaultValue: PropTypes.string,
      isUserInput: PropTypes.bool.isRequired,
    })
  ),
  /* eslint-enable react/require-default-props */
};

const mapDispatchToProps = (dispatch) => ({
  deleteFileAction: (fileObject) => dispatch(deleteFile(fileObject)),
  saveAction: (values, params) => dispatch(save(values, params)),
});

const mapStateToProps = (state) => ({
  actionState: state.deposit.actionState,
  files: state.files.entries,
});

export const FilesField = connect(
  mapStateToProps,
  mapDispatchToProps
)(FilesFieldComponent);
