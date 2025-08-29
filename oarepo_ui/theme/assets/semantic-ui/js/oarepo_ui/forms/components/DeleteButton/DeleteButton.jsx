import React from "react";
import { Button } from "semantic-ui-react";
import { i18next } from "@translations/oarepo_ui/i18next";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { ConfirmationModal } from "../ConfirmationModal";
import { DRAFT_DELETE_STARTED } from "@js/invenio_rdm_records/src/deposit/state/types";
import { delete_ } from "../../state/deposit/actions";
import { useDepositFormAction, useConfirmationModal } from "../../hooks";

const DeleteButtonComponent = React.memo(
  ({
    record,
    deleteAction,
    actionState,
    modalMessage = i18next.t(
      "If you delete the draft, the work you have done on it will be lost."
    ),
    modalHeader = i18next.t("Are you sure you wish delete this draft?"),
    redirectUrl = "",
  }) => {
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

DeleteButtonComponent.displayName = "DeleteButtonComponent";

const mapDispatchToProps = (dispatch) => ({
  deleteAction: (draft, params) => dispatch(delete_(draft, params)),
});

const mapStateToProps = (state) => ({
  actionState: state.deposit.actionState,
  record: state.deposit.record,
});

DeleteButtonComponent.propTypes = {
  record: PropTypes.object.isRequired,
  /* eslint-disable react/require-default-props */
  modalMessage: PropTypes.string,
  modalHeader: PropTypes.string,
  redirectUrl: PropTypes.string,
  /* eslint-enable react/require-default-props */
  deleteAction: PropTypes.func.isRequired,
  actionState: PropTypes.string,
};

export const DeleteButton = connect(
  mapStateToProps,
  mapDispatchToProps
)(DeleteButtonComponent);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeleteButtonComponent);
