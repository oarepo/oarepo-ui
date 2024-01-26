import React from "react";
import { Modal, Icon, Message } from "semantic-ui-react";

export function ConfirmationModal({
  header,
  content,
  trigger,
  actions,
  isOpen,
  close,
}) {
  return (
    <>
      {trigger}
      <Modal
        open={isOpen}
        onClose={close}
        size="small"
        closeIcon
        closeOnDimmerClick={false}
      >
        <Modal.Header>{header}</Modal.Header>
        {content && (
          <Modal.Content>
            <Message visible warning>
              <p>
                <Icon name="warning sign" /> {content}
              </p>
            </Message>
          </Modal.Content>
        )}
        <Modal.Actions>{actions}</Modal.Actions>
      </Modal>
    </>
  );
}

export default ConfirmationModal;
