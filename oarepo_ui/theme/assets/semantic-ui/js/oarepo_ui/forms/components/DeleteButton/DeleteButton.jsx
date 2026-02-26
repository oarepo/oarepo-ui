import React, { useCallback } from "react";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { ConfirmationModal } from "../ConfirmationModal";
import { DRAFT_DELETE_STARTED } from "@js/invenio_rdm_records/src/deposit/state/types";
import { delete_ } from "../../state/deposit/actions";
import { useDepositFormAction, useConfirmationModal } from "../../hooks";

export const DeleteButton = React.memo(
  ({
    modalMessage = i18next.t(
      "If you delete the draft, the work you have done on it will be lost."
    ),
    modalHeader = i18next.t("Are you sure you wish delete this draft?"),
    redirectUrl = undefined,
  }) => {
    const dispatch = useDispatch();
    const record = useSelector((state) => state.deposit.record);
    const actionState = useSelector((state) => state.deposit.actionState);

    const deleteAction = useCallback(
      (draft, params) => dispatch(delete_(draft, params)),
      [dispatch]
    );

    const {
      isOpen: isModalOpen,
      close: closeModal,
      open: openModal,
    } = useConfirmationModal();

    const { handleAction: handleDelete, isSubmitting } = useDepositFormAction({
      action: deleteAction,
      params: { redirectUrl },
    });

    return (
      record.id && (
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
              loading={actionState === DRAFT_DELETE_STARTED}
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
                loading={actionState === DRAFT_DELETE_STARTED}
                color="red"
                onClick={() => {
                  handleDelete();
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
      )
    );
  }
);

DeleteButton.displayName = "DeleteButton";

DeleteButton.propTypes = {
  /* eslint-disable react/require-default-props */
  modalMessage: PropTypes.string,
  modalHeader: PropTypes.string,
  redirectUrl: PropTypes.string,
  /* eslint-enable react/require-default-props */
};

export default DeleteButton;
