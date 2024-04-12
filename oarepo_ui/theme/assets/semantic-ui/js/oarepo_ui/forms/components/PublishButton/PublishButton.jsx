import React from "react";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  useConfirmationModal,
  useDepositApiClient,
  ConfirmationModal,
} from "@js/oarepo_ui";
import PropTypes from "prop-types";

export const PublishButton = React.memo(
  ({ modalMessage, modalHeader, additionalInputs }) => {
    const {
      isOpen: isModalOpen,
      close: closeModal,
      open: openModal,
    } = useConfirmationModal();
    const { isSubmitting, publish } = useDepositApiClient();

    return (
      <ConfirmationModal
        additionalInputs={additionalInputs}
        header={modalHeader}
        content={modalMessage}
        isOpen={isModalOpen}
        close={closeModal}
        trigger={
          <Button
            name="publish"
            color="green"
            onClick={openModal}
            icon="upload"
            labelPosition="left"
            content={i18next.t("Publish")}
            type="button"
            disabled={isSubmitting}
            loading={isSubmitting}
            fluid
          />
        }
        actions={
          <>
            <Button onClick={closeModal} floated="left">
              {i18next.t("Cancel")}
            </Button>
            <Button
              name="publish"
              disabled={isSubmitting}
              loading={isSubmitting}
              color="green"
              onClick={() => {
                publish();
                closeModal();
              }}
              icon="upload"
              labelPosition="left"
              content={i18next.t("Publish")}
              type="submit"
            />
          </>
        }
      />
    );
  }
);

PublishButton.propTypes = {
  modalMessage: PropTypes.string,
  modalHeader: PropTypes.string,
  additionalInputs: PropTypes.node,
};

PublishButton.defaultProps = {
  modalHeader: i18next.t("Are you sure you wish to publish this draft?"),
  modalMessage: i18next.t(
    "Once the record is published you will no longer be able to change record's files! However, you will still be able to update the record's metadata later."
  ),
};

export default PublishButton;
