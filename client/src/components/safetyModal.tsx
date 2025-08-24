import { Modal, Button } from "antd";

interface SafetyModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export const SafetyModal = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
}: SafetyModalProps) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      centered
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {cancelText}
        </Button>,
        <Button
          key="confirm"
          type={danger ? "primary" : "default"}
          danger={danger}
          onClick={onConfirm}
          style={{ backgroundColor: "#bb1717ff" }}
        >
          {confirmText}
        </Button>,
      ]}
      title={title}
    >
      <p style={{ fontSize: "16px" }}>{message}</p>
    </Modal>
  );
};
