import React, { useState, useCallback } from 'react';
import { Modal, Button, Typography, theme as antTheme } from "antd";
import { DeleteOutlined, ExclamationCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import type { ButtonProps } from 'antd';
import { useThemeStore } from '../store/themeStore';

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
  const isSmallScreen = window.innerWidth <= 768;
  
  // Tema
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";
  const { token } = antTheme.useToken();
  
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      centered
      width={isSmallScreen ? '90%' : 520}
      footer={[
        <Button 
          key="cancel" 
          onClick={onCancel}
          size={isSmallScreen ? 'middle' : 'large'}
        >
          {cancelText}
        </Button>,
        <Button
          key="confirm"
          type={danger ? "primary" : "default"}
          danger={danger}
          onClick={onConfirm}
          size={isSmallScreen ? 'middle' : 'large'}
          style={{ backgroundColor: "#bb1717ff" }}
        >
          {confirmText}
        </Button>,
      ]}
      title={title}
      styles={{
        header: {
          padding: isSmallScreen ? '12px 16px' : '16px 24px'
        },
        body: {
          padding: isSmallScreen ? '8px 16px 16px 16px' : '16px 24px'
        }
      }}
    >
      <p style={{ 
        fontSize: isSmallScreen ? "14px" : "16px",
        lineHeight: '1.5',
        margin: '0',
        padding: isSmallScreen ? '8px 0' : '0',
        color: isDark ? token.colorText : '#262626'
      }}>
        {message}
      </p>
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

  // Detectar vista móvil
  const isSmallScreen = window.innerWidth <= 768;
  
  // Tema
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";
  const { token } = antTheme.useToken();

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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: isDark ? token.colorError : '#d32f2f',
            padding: `${token.paddingXS}px 0`
          }}>
            <ExclamationCircleOutlined style={{ 
              marginRight: token.marginXS, 
              fontSize: isSmallScreen ? '16px' : '20px' 
            }} />
            <span style={{ 
              fontWeight: '600',
              fontSize: isSmallScreen ? '14px' : '16px'
            }}>
              Confirmar eliminación
            </span>
          </div>
        }
        open={modalOpen}
        onOk={handleConfirmDelete}
        onCancel={handleCancel}
        okText={confirmText}
        cancelText={cancelText}
        confirmLoading={deleting}
        centered
        width={isSmallScreen ? '90%' : 480}
        styles={{
          header: {
            padding: isSmallScreen ? '12px 16px' : '16px 24px'
          },
          body: {
            padding: isSmallScreen ? '8px 16px 16px 16px' : `${token.paddingLG}px`
          }
        }}
        okButtonProps={{
          danger: true,
          size: isSmallScreen ? 'middle' : 'large',
          style: {
            backgroundColor: isDark ? token.colorErrorActive : '#d32f2f',
            borderColor: isDark ? token.colorErrorBorder : '#d32f2f',
            fontWeight: '500'
          }
        }}
        cancelButtonProps={{
          size: isSmallScreen ? 'middle' : 'large',
          style: {
            borderColor: isDark ? token.colorBorder : '#7A85C1',
            color: isDark ? token.colorText : '#3B38A0',
            fontWeight: '500'
          }
        }}
      >
        <div style={{ textAlign: 'center' }}>
          {/* Ícono principal de eliminación */}
          <div style={{
            fontSize: isSmallScreen ? '36px' : '48px',
            color: isDark ? token.colorError : '#ff7875',
            marginBottom: isSmallScreen ? '12px' : token.marginLG,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <DeleteOutlined style={{ fontSize: isSmallScreen ? '36px' : '48px' }} />
          </div>

          {/* Mensaje de confirmación */}
          <p style={{
            marginBottom: isSmallScreen ? '12px' : token.marginLG,
            fontSize: isSmallScreen ? '14px' : '16px',
            color: isDark ? token.colorText : '#262626',
            lineHeight: '1.5',
            padding: isSmallScreen ? '0 8px' : '0'
          }}>
            {modalMessage}
          </p>

          {/* Información del recurso */}
          <div style={{
            backgroundColor: isDark ? token.colorWarningBg : '#fff2e8',
            border: `1px solid ${isDark ? token.colorWarningBorder : '#ffcc7a'}`,
            borderRadius: token.borderRadius,
            padding: isSmallScreen ? '12px' : token.paddingLG,
            marginTop: isSmallScreen ? '12px' : token.marginLG,
            textAlign: 'left'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: token.marginXS,
              flexWrap: isSmallScreen ? 'wrap' : 'nowrap'
            }}>
              <div style={{ 
                color: isDark ? token.colorWarning : '#d46b08', 
                fontSize: isSmallScreen ? '14px' : '16px' 
              }}>
                {resourceInfo.icon || <FileTextOutlined />}
              </div>
              <Text strong style={{ 
                color: isDark ? token.colorWarning : '#d46b08', 
                fontSize: isSmallScreen ? '12px' : '14px',
                marginLeft: token.marginXS,
                wordBreak: 'break-word'
              }}>
                {resourceInfo.name}
              </Text>
              {resourceInfo.type && (
                <Text style={{ 
                  fontSize: isSmallScreen ? '10px' : '12px',
                  marginLeft: token.marginXS,
                  color: isDark ? token.colorWarningText : '#fa8c16'
                }}>
                  ({resourceInfo.type})
                </Text>
              )}
            </div>

            {/* Información adicional */}
            {resourceInfo.additionalInfo && (
              <div style={{ 
                marginTop: token.marginXS, 
                fontSize: isSmallScreen ? '10px' : '12px', 
                color: isDark ? token.colorWarningText : '#d48806' 
              }}>
                {resourceInfo.additionalInfo}
              </div>
            )}

            {/* Mensaje de advertencia */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginTop: token.marginXS,
              flexWrap: isSmallScreen ? 'wrap' : 'nowrap'
            }}>
              <ExclamationCircleOutlined style={{ 
                color: isDark ? token.colorWarning : '#fa8c16', 
                marginRight: token.marginXXS, 
                fontSize: isSmallScreen ? '10px' : '12px' 
              }} />
              <Text style={{ 
                fontSize: isSmallScreen ? '10px' : '12px', 
                fontStyle: 'italic',
                color: isDark ? token.colorWarningText : '#d48806'
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