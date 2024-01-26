import React from "react";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  useConfirmationModal,
  useDepositApiClient,
  ConfirmationModal,
} from "@js/oarepo_ui";
import PropTypes from "prop-types";

export const PublishButton = React.memo(({ modalMessage, modalHeader }) => {
  const {
    isOpen: isModalOpen,
    close: closeModal,
    open: openModal,
  } = useConfirmationModal();
  const { isSubmitting, publish } = useDepositApiClient();

  return (
    <ConfirmationModal
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
});

PublishButton.propTypes = {
  modalMessage: PropTypes.string,
  modalHeader: PropTypes.string,
};

PublishButton.defaultProps = {
  modalHeader: i18next.t("Are you sure you wish to publish this draft?"),
};

export default PublishButton;
