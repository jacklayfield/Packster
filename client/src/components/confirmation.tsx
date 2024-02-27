import React from "react";
import { Modal, Button } from "react-bootstrap";

interface DPROPS {
  showModal: boolean;
  hideModal: Function;
  confirmModal: Function;
  message: String;
  title?: String;
  yesButton?: String;
  noButton?: String;
}

export const Confirmation: React.FC<DPROPS> = ({
  showModal,
  hideModal,
  confirmModal,
  message,
  title,
  yesButton,
  noButton,
}) => {
  return (
    <Modal show={showModal} onHide={() => hideModal()}>
      <Modal.Header closeButton>
        <Modal.Title>{title || "Confirmation"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="alert alert-danger">{message}</div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="default" onClick={() => hideModal()}>
          {noButton || "No"}
        </Button>
        <Button variant="danger" onClick={() => confirmModal()}>
          {yesButton || "Yes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
