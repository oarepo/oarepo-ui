import React from "react";
import { Modal, Icon, Message, Form } from "semantic-ui-react";
import PropTypes from "prop-types";

export function ConfirmationModal({
  header,
  content,
  trigger,
  actions,
  isOpen,
  close,
  additionalInputs,
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
        {(content || additionalInputs) && (
          <Modal.Content>
            {additionalInputs && <Form>{additionalInputs}</Form>}
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

ConfirmationModal.propTypes = {
  header: PropTypes.string,
  content: PropTypes.string,
  trigger: PropTypes.element,
  actions: PropTypes.node,
  additionalInputs: PropTypes.node,
  isOpen: PropTypes.bool,
  close: PropTypes.func,
};

export default ConfirmationModal;
