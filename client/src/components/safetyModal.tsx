import React, { useState, useCallback } from 'react';
import { Modal, Button, Typography } from "antd";
import { DeleteOutlined, ExclamationCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ButtonProps } from 'antd';

const { Text } = Typography;

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

/**
 * Información del recurso que se va a eliminar
 */
interface ResourceInfo {
  /** Nombre del recurso a eliminar */
  name: string;
  /** Tipo de recurso (ej: "Documento PDF", "Usuario", "Curso") */
  type?: string;
  /** Ícono que representa el recurso */
  icon?: React.ReactNode;
  /** Información adicional que se mostrará en el modal */
  additionalInfo?: string | React.ReactNode;
}

/**
 * Configuración del botón de eliminación
 */
interface ButtonConfig {
  /** Mostrar texto "Eliminar" junto al ícono */
  showText?: boolean;
  /** Ancho del botón en píxeles */
  width?: number;
  /** Alto del botón en píxeles */
  height?: number;
  /** Estilo del botón */
  variant?: 'fill' | 'ghost' | 'text' | 'link';
  /** Tamaño del botón */
  size?: 'small' | 'middle' | 'large';
  /** Forma del botón */
  shape?: 'default' | 'circle' | 'round';
  /** Si el botón está deshabilitado */
  disabled?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Configuración del modal de confirmación
 */
interface ModalConfig {
  /** Mensaje personalizado de confirmación */
  message?: string;
  /** Texto del botón de confirmación */
  confirmText?: string;
  /** Texto del botón de cancelación */
  cancelText?: string;
}

/**
 * Props del componente DeleteButton
 */
interface DeleteButtonProps {
  /** Función que se ejecuta para eliminar el recurso */
  onDelete: () => Promise<void> | void;
  /** Información del recurso a eliminar */
  resourceInfo: ResourceInfo;
  /** Configuración del botón */
  buttonConfig?: ButtonConfig;
  /** Configuración del modal */
  modalConfig?: ModalConfig;
  /** Callback que se ejecuta antes de mostrar el modal */
  onDeleteStart?: () => void;
  /** Callback que se ejecuta después de eliminar exitosamente */
  onDeleteSuccess?: () => void;
  /** Callback que se ejecuta si hay error en la eliminación */
  onDeleteError?: (error: Error) => void;
  /** Callback que se ejecuta cuando se cancela la eliminación */
  onCancel?: () => void;
  /** Si el botón está deshabilitado externamente */
  disabled?: boolean;
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

/**
 * DeleteButton - Componente reutilizable para eliminación con confirmación
 * 
 * Este componente encapsula un botón de eliminación junto con un modal de confirmación.
 * Maneja internamente todos los estados necesarios (loading, modal abierto, etc.)
 * y proporciona callbacks para diferentes eventos del flujo de eliminación.
 * 
 * Características:
 * - Color fijo: #bb1717ff
 * - Ícono fijo: DeleteOutlined
 * - Modal de confirmación con estilos predefinidos
 * - Manejo automático de estados de carga y errores
 * 
 * @example
 * ```tsx
 * // Botón simple con texto
 * <DeleteButton
 *   onDelete={() => deleteDocument(doc.id)}
 *   resourceInfo={{
 *     name: doc.name,
 *     type: "Documento PDF",
 *     icon: <FileTextOutlined />
 *   }}
 *   buttonConfig={{ showText: true }}
 *   onDeleteSuccess={() => message.success("Eliminado")}
 * />
 * 
 * // Botón solo con ícono
 * <DeleteButton
 *   onDelete={() => deleteUser(user.id)}
 *   resourceInfo={{
 *     name: user.name,
 *     type: "Usuario"
 *   }}
 *   buttonConfig={{ 
 *     showText: false, 
 *     variant: "ghost",
 *     shape: "circle" 
 *   }}
 * />
 * ```
 */
const DeleteButton: React.FC<DeleteButtonProps> = ({
  onDelete,
  resourceInfo,
  buttonConfig = {},
  modalConfig = {},
  onDeleteStart,
  onDeleteSuccess,
  onDeleteError,
  onCancel,
  disabled = false
}) => {
  // Estados internos
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Configuración por defecto del botón
  const {
    showText = true,
    width,
    height,
    variant = 'fill',
    size = 'middle',
    shape = 'default',
    disabled: buttonDisabled = false,
    className = ''
  } = buttonConfig;

  // Configuración por defecto del modal
  const {
    message: modalMessage = '¿Estás seguro de que deseas eliminar este elemento?',
    confirmText = 'Eliminar',
    cancelText = 'Cancelar'
  } = modalConfig;

  // Color fijo del componente
  const FIXED_COLOR = '#bb1717ff';

  // Mapeo de variantes a props de Ant Design
  const getButtonProps = (): ButtonProps => {
    const baseProps: ButtonProps = {
      icon: <DeleteOutlined />,
      size,
      shape,
      disabled: disabled || buttonDisabled || deleting,
      className,
      style: {
        width,
        height,
        color: variant === 'fill' ? '#ffffff' : FIXED_COLOR,
        backgroundColor: variant === 'fill' ? FIXED_COLOR : 'transparent',
        borderColor: FIXED_COLOR,
        ...(['ghost', 'text', 'link'].includes(variant) && {
          backgroundColor: 'transparent'
        })
      }
    };

    switch (variant) {
      case 'fill':
        return { ...baseProps, type: 'primary' };
      case 'ghost':
        return { ...baseProps, ghost: true };
      case 'text':
        return { ...baseProps, type: 'text' };
      case 'link':
        return { ...baseProps, type: 'link' };
      default:
        return { ...baseProps, type: 'default' };
    }
  };

  // Manejo del clic en el botón
  const handleButtonClick = useCallback(() => {
    onDeleteStart?.();
    setModalOpen(true);
  }, [onDeleteStart]);

  // Confirmación de eliminación
  const handleConfirmDelete = useCallback(async () => {
    try {
      setDeleting(true);
      await onDelete();
      setModalOpen(false);
      onDeleteSuccess?.();
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error('Error desconocido');
      onDeleteError?.(errorInstance);
    } finally {
      setDeleting(false);
    }
  }, [onDelete, onDeleteSuccess, onDeleteError]);

  // Cancelación de eliminación
  const handleCancel = useCallback(() => {
    setModalOpen(false);
    onCancel?.();
  }, [onCancel]);

  return (
    <>
      {/* Botón de eliminación */}
      <Button
        {...getButtonProps()}
        onClick={handleButtonClick}
      >
        {showText && 'Eliminar'}
      </Button>

      {/* Modal de confirmación */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', color: '#d32f2f' }}>
            <ExclamationCircleOutlined style={{ marginRight: '8px', fontSize: '20px' }} />
            <span style={{ fontWeight: '600' }}>Confirmar eliminación</span>
          </div>
        }
        open={modalOpen}
        onOk={handleConfirmDelete}
        onCancel={handleCancel}
        okText={confirmText}
        cancelText={cancelText}
        confirmLoading={deleting}
        centered
        width={480}
        okButtonProps={{
          danger: true,
          size: 'large',
          style: {
            backgroundColor: '#d32f2f',
            borderColor: '#d32f2f',
            fontWeight: '500'
          }
        }}
        cancelButtonProps={{
          size: 'large',
          style: {
            borderColor: '#7A85C1',
            color: '#3B38A0',
            fontWeight: '500'
          }
        }}
      >
        <div style={{ textAlign: 'center' }}>
          {/* Ícono principal de eliminación */}
          <div style={{
            fontSize: '48px',
            color: '#ff7875',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <DeleteOutlined style={{ fontSize: '48px' }} />
          </div>

          {/* Mensaje de confirmación */}
          <p style={{
            marginBottom: '16px',
            fontSize: '16px',
            color: '#262626',
            lineHeight: '1.5'
          }}>
            {modalMessage}
          </p>

          {/* Información del recurso */}
          <div style={{
            backgroundColor: '#fff2e8',
            border: '1px solid #ffcc7a',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '16px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ color: '#d46b08', fontSize: '16px' }}>
                {resourceInfo.icon || <FileTextOutlined />}
              </div>
              <Text strong style={{ 
                color: '#d46b08', 
                fontSize: '14px',
                marginLeft: '8px'
              }}>
                {resourceInfo.name}
              </Text>
              {resourceInfo.type && (
                <Text style={{ 
                  fontSize: '12px',
                  marginLeft: '8px',
                  color: '#fa8c16'
                }}>
                  ({resourceInfo.type})
                </Text>
              )}
            </div>

            {/* Información adicional */}
            {resourceInfo.additionalInfo && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#d48806' }}>
                {resourceInfo.additionalInfo}
              </div>
            )}

            {/* Mensaje de advertencia */}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
              <ExclamationCircleOutlined style={{ 
                color: '#fa8c16', 
                marginRight: '6px', 
                fontSize: '12px' 
              }} />
              <Text style={{ 
                fontSize: '12px', 
                fontStyle: 'italic',
                color: '#d48806'
              }}>
                Esta acción no se puede deshacer
              </Text>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeleteButton;

// Exportar tipos para uso externo
export type { DeleteButtonProps, ResourceInfo, ButtonConfig, ModalConfig };