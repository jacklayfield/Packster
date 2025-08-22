import React from "react";
import { Modal, Button } from "react-bootstrap";

interface DPROPS {
  id: String;
  showModal: boolean;
  hideModal: Function;
  confirmModal: Function;
  message: string;
  title?: string;
  yesButton?: string;
  noButton?: string;
  accentColor?: string;
}

export const Confirmation: React.FC<DPROPS> = ({
  id,
  showModal,
  hideModal,
  confirmModal,
  message,
  title,
  yesButton,
  noButton,
  accentColor,
}) => {
  return (
    <Modal show={showModal} onHide={() => hideModal()} id={id}>
      <Modal.Header closeButton>
        <Modal.Title>{title || "Confirmation"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          className="alert"
          style={{ backgroundColor: accentColor || "#C4B5FD" }}
        >
          {message}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="default" onClick={() => hideModal()}>
          {noButton || "No"}
        </Button>
        <Button
          style={{ backgroundColor: accentColor || "#C4B5FD", border: 0 }}
          onClick={() => confirmModal()}
        >
          {yesButton || "Yes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
