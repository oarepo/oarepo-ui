import React from "react";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import {
  useConfirmationModal,
  useFormConfig,
  useDepositApiClient,
  ConfirmationModal,
} from "@js/oarepo_ui";
import PropTypes from "prop-types";

export const DeleteButton = React.memo(
  ({ modalMessage, modalHeader, redirectUrl }) => {
    const {
      isOpen: isModalOpen,
      close: closeModal,
      open: openModal,
    } = useConfirmationModal();
    const {
      formConfig: { permissions },
    } = useFormConfig();
    const { values, isSubmitting, _delete } = useDepositApiClient();

    return (
      <>
        {values.id && permissions?.can_delete && (
          <ConfirmationModal
            header={modalHeader}
            content={modalMessage}
            isOpen={isModalOpen}
            close={closeModal}
            trigger={
              <Button
                name="delete"
                color="red"
                onClick={openModal}
                icon="delete"
                labelPosition="left"
                content={i18next.t("Delete draft")}
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
                  name="delete"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  color="red"
                  onClick={() => {
                    _delete(redirectUrl);
                    closeModal();
                  }}
                  icon="delete"
                  labelPosition="left"
                  content={i18next.t("Delete draft")}
                  type="button"
                />
              </>
            }
          />
        )}
      </>
    );
  }
);

DeleteButton.propTypes = {
  modalMessage: PropTypes.string,
  modalHeader: PropTypes.string,
  redirectUrl: PropTypes.string,
};

DeleteButton.defaultProps = {
  modalHeader: i18next.t("Are you sure you wish delete this draft?"),
  modalMessage: i18next.t(
    "If you delete the draft, the work you have done on it will be lost."
  ),
};

export default DeleteButton;
