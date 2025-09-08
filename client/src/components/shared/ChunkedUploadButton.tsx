import React, { useState, useCallback, useRef } from 'react';
import { 
  Button, 
  Modal, 
  Upload, 
  Progress, 
  Typography, 
  Steps, 
  Alert, 
  message, 
  Grid, 
  theme as antTheme,
  Space,
  Card,
  Divider,
  Statistic,
  Row,
  Col
} from 'antd';
import { 
  CloudUploadOutlined, 
  PlusOutlined, 
  FileAddOutlined, 
  CheckCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  StopOutlined
} from '@ant-design/icons';
import { useThemeStore } from '../../store/themeStore';
import { chunkedUploadService } from '../../services/chunkedUpload.service';
import type { 
  ChunkedUploadProgress, 
  ChunkedUploadOptions, 
  ChunkedUploadResult 
} from '../../services/chunkedUpload.service';
import type { RcFile } from 'rc-upload/lib/interface';
import type { ButtonProps } from 'antd';

const { Dragger } = Upload;
const { Text, Title } = Typography;
const { Step } = Steps;
const { useBreakpoint } = Grid;

/**
 * Configuración de un paso del procesamiento
 */
interface ProcessingStep {
  /** Clave única del paso */
  key: string;
  /** Título del paso */
  title: string;
  /** Descripción del paso */
  description: string;
}

/**
 * Configuración de archivos aceptados
 */
interface FileConfig {
  /** Tipos de archivo aceptados (ej: ".pdf", ".docx", ".jpg") */
  accept: string;
  /** Tamaño máximo en bytes */
  maxSize: number;
  /** Mensaje de validación personalizado */
  validationMessage?: string;
  /** Tamaño de chunk para upload chunked (opcional) */
  chunkSize?: number;
}

/**
 * Configuración del procesamiento
 */
interface ProcessingConfig {
  /** Lista de pasos del procesamiento */
  steps: ProcessingStep[];
  /** Texto que aparece durante el procesamiento */
  processingText?: string;
  /** Texto de éxito al completar */
  successText?: string;
}

/**
 * Configuración del botón de subida
 */
interface ButtonConfig {
  /** Mostrar texto "Subir Archivo" junto al ícono */
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
 * Configuración del modal
 */
interface ModalConfig {
  /** Título del modal */
  title?: string;
  /** Ancho del modal */
  width?: number;
}

/**
 * Estado interno de cada paso de procesamiento
 */
interface ProcessingStepState extends ProcessingStep {
  status: 'wait' | 'process' | 'finish' | 'error';
}

/**
 * Información detallada del progreso del upload
 */
interface UploadProgressInfo {
  uploadedBytes: number;
  totalBytes: number;
  speed: number; // bytes por segundo
  timeRemaining: number; // segundos
  chunksUploaded: number;
  totalChunks: number;
}

/**
 * Props del componente ChunkedUploadButton
 */
interface ChunkedUploadButtonProps {
  /** Función que se ejecuta después del upload chunked exitoso para procesamiento adicional */
  onPostUploadProcess?: (
    document: ChunkedUploadResult['document'],
    onProgress?: (step: string, progress: number, message: string) => void
  ) => Promise<unknown>;
  /** Configuración de archivos aceptados */
  fileConfig: FileConfig;
  /** Configuración del procesamiento */
  processingConfig: ProcessingConfig;
  /** Configuración del botón */
  buttonConfig?: ButtonConfig;
  /** Configuración del modal */
  modalConfig?: ModalConfig;
  /** Callback que se ejecuta antes de mostrar el modal */
  onUploadStart?: (file: File) => void;
  /** Callback que se ejecuta después de procesar exitosamente */
  onUploadSuccess?: (result: unknown) => void;
  /** Callback que se ejecuta si hay error en el procesamiento */
  onUploadError?: (error: Error) => void;
  /** Callback que se ejecuta cuando se cierra el modal */
  onModalClose?: () => void;
  /** Si el botón está deshabilitado externamente */
  disabled?: boolean;
}

/**
 * ChunkedUploadButton - Componente avanzado para subida de archivos con chunks
 * 
 * Características principales:
 * - Upload chunked con progreso detallado
 * - Cancelación de upload en cualquier momento
 * - Reintento automático para chunks fallidos
 * - Manejo robusto de errores con opción de reintentar
 * - Información detallada de velocidad y tiempo restante
 * - Compatibilidad completa con el componente anterior
 * 
 * @example
 * ```tsx
 * <ChunkedUploadButton
 *   fileConfig={{
 *     accept: ".pdf",
 *     maxSize: 100 * 1024 * 1024,
 *     chunkSize: 2 * 1024 * 1024, // 2MB chunks
 *     validationMessage: "Solo archivos PDF de máximo 100MB"
 *   }}
 *   processingConfig={{
 *     steps: [
 *       { key: 'upload', title: 'Subir Archivo', description: 'Subiendo por chunks' },
 *       { key: 'process', title: 'Procesar', description: 'Procesando contenido' }
 *     ]
 *   }}
 *   onPostUploadProcess={processDocumentComplete}
 *   onUploadSuccess={() => message.success("Archivo procesado")}
 * />
 * ```
 */
const ChunkedUploadButton: React.FC<ChunkedUploadButtonProps> = ({
  onPostUploadProcess,
  fileConfig,
  processingConfig,
  buttonConfig = {},
  modalConfig = {},
  onUploadStart,
  onUploadSuccess,
  onUploadError,
  onModalClose,
  disabled = false
}) => {
  // Estados principales
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);
  
  // Estados de progreso
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadProgressInfo, setUploadProgressInfo] = useState<UploadProgressInfo | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Estados de procesamiento
  const [processingSteps, setProcessingSteps] = useState<ProcessingStepState[]>([]);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  
  // Referencias para control de tiempo
  const uploadStartTime = useRef<number>(0);
  const lastProgressUpdate = useRef<number>(0);
  const speedHistory = useRef<number[]>([]);

  // Hooks de tema y responsividad
  const screens = useBreakpoint();
  const isSmallScreen = !screens.lg;
  const { token } = antTheme.useToken();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // Configuración por defecto del botón
  const {
    showText = true,
    width,
    height,
    variant = 'fill',
    size = 'large',
    shape = 'default',
    disabled: buttonDisabled = false,
    className = ''
  } = buttonConfig;

  // Configuración por defecto del modal
  const {
    title = 'Cargar Nuevo Archivo',
    width: modalWidth = 700
  } = modalConfig;

  // Configuración por defecto del procesamiento
  const {
    processingText = 'Procesando archivo...',
    successText = '¡Archivo procesado exitosamente!'
  } = processingConfig;

  // Color del componente
  const FIXED_COLOR = token.colorBgElevated === '#141d47' ? '#5b6ef0' : '#1A2A80';

  // Inicializar pasos de procesamiento
  React.useEffect(() => {
    setProcessingSteps(
      processingConfig.steps.map(step => ({
        ...step,
        status: 'wait' as const
      }))
    );
  }, [processingConfig.steps]);

  // Calcular velocidad de upload
  const calculateUploadSpeed = useCallback((uploadedBytes: number): number => {
    const now = Date.now();
    if (uploadStartTime.current === 0) {
      uploadStartTime.current = now;
      return 0;
    }

    const timeDiff = (now - lastProgressUpdate.current) / 1000; // segundos
    if (timeDiff > 0) {
      const speed = uploadedBytes / ((now - uploadStartTime.current) / 1000);
      speedHistory.current.push(speed);
      
      // Mantener solo los últimos 10 valores para suavizar
      if (speedHistory.current.length > 10) {
        speedHistory.current.shift();
      }
      
      // Promedio de velocidades para suavizar fluctuaciones
      const avgSpeed = speedHistory.current.reduce((sum, s) => sum + s, 0) / speedHistory.current.length;
      lastProgressUpdate.current = now;
      return avgSpeed;
    }
    
    return 0;
  }, []);

  // Formatear bytes para mostrar
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Formatear tiempo restante
  const formatTimeRemaining = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || seconds <= 0) return 'Calculando...';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }, []);

  // Mapeo de variantes a props de Ant Design
  const getButtonProps = (): ButtonProps => {
    const baseProps: ButtonProps = {
      icon: <CloudUploadOutlined />,
      size,
      shape,
      disabled: disabled || buttonDisabled || currentPhase === 'uploading' || currentPhase === 'processing',
      className,
      style: {
        width,
        height
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

  // Validar archivo
  const validateFile = (file: File): string | null => {
    // Verificar tipo de archivo
    const acceptedTypes = fileConfig.accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type === type;
    });

    if (!isValidType) {
      return fileConfig.validationMessage || `Solo se permiten archivos: ${fileConfig.accept}`;
    }

    // Verificar tamaño
    if (file.size > fileConfig.maxSize) {
      const maxSizeMB = (fileConfig.maxSize / 1024 / 1024).toFixed(1);
      return `El archivo es demasiado grande. Máximo permitido: ${maxSizeMB} MB`;
    }

    return null;
  };

  // Manejo del clic en el botón
  const handleButtonClick = useCallback(() => {
    setModalOpen(true);
    resetUploader();
  }, []);

  // Callback para progreso de upload chunked
  const handleUploadProgress = useCallback((progress: ChunkedUploadProgress) => {
    setUploadProgress(progress.progress);
    setCurrentStep(progress.message);
    
    // Actualizar información detallada de progreso
    if (progress.uploadedBytes && progress.totalBytes) {
      const speed = calculateUploadSpeed(progress.uploadedBytes);
      const timeRemaining = speed > 0 ? (progress.totalBytes - progress.uploadedBytes) / speed : 0;
      
      setUploadProgressInfo({
        uploadedBytes: progress.uploadedBytes,
        totalBytes: progress.totalBytes,
        speed,
        timeRemaining,
        chunksUploaded: 0, // Se actualizará con la info de la sesión
        totalChunks: 0
      });
    }
  }, [calculateUploadSpeed]);

  // Manejo de selección de archivo
  const handleFileSelect = (file: RcFile): boolean => {
    const validationError = validateFile(file);
    if (validationError) {
      message.error(validationError);
      return false;
    }

    setSelectedFile(file);
    setError(null);
    onUploadStart?.(file);
    handleFileUpload(file);
    return false; // Prevenir subida automática
  };

  // Procesamiento del archivo con upload chunked
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setCurrentPhase('uploading');
      setUploadProgress(0);
      setError(null);
      uploadStartTime.current = Date.now();
      lastProgressUpdate.current = Date.now();
      speedHistory.current = [];

      // Configurar opciones de upload chunked
      const options: ChunkedUploadOptions = {
        chunkSize: fileConfig.chunkSize || 2 * 1024 * 1024, // 2MB por defecto
        maxRetries: 3,
        onProgress: handleUploadProgress,
        onChunkComplete: (chunkIndex, totalChunks) => {
          setUploadProgressInfo(prev => prev ? {
            ...prev,
            chunksUploaded: chunkIndex + 1,
            totalChunks
          } : null);
        }
      };

      // Realizar upload chunked
      const result = await chunkedUploadService.uploadFileWithChunks(file, options);
      
      if (!result.success) {
        throw new Error(result.error || 'Error en la subida chunked');
      }

      setUploadSessionId(result.sessionId);

      // Si hay procesamiento post-upload, ejecutarlo
      if (onPostUploadProcess && result.document) {
        setCurrentPhase('processing');
        setProcessingProgress(0);

        const postProcessResult = await onPostUploadProcess(
          result.document,
          (step, progress, message) => {
            setCurrentStep(message);
            setProcessingProgress(progress);
            
            // Actualizar el estado de los pasos
            setProcessingSteps(prev => prev.map(s => {
              if (s.key === step) {
                return { ...s, status: progress === 100 ? 'finish' : 'process' };
              } else if (prev.findIndex(ps => ps.key === step) > prev.findIndex(ps => ps.key === s.key)) {
                return { ...s, status: 'wait' };
              } else {
                return { ...s, status: 'finish' };
              }
            }));
          }
        );

        setCurrentPhase('success');
        onUploadSuccess?.(postProcessResult);
      } else {
        setCurrentPhase('success');
        onUploadSuccess?.(result);
      }

    } catch (error) {
      setCurrentPhase('error');
      setUploadProgress(0);
      setProcessingProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Error en el procesamiento';
      setError(errorMessage);
      
      // Marcar el paso actual como error
      setProcessingSteps(prev => prev.map(s => 
        s.status === 'process' ? { ...s, status: 'error' } : s
      ));
      
      onUploadError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [
    fileConfig.chunkSize,
    handleUploadProgress,
    onPostUploadProcess,
    onUploadSuccess,
    onUploadError
  ]);

  // Cancelar upload
  const handleCancelUpload = useCallback(async () => {
    if (uploadSessionId && currentPhase === 'uploading') {
      try {
        await chunkedUploadService.cancelUpload(uploadSessionId);
        setCurrentPhase('error');
        setError('Upload cancelado por el usuario');
        setCurrentStep('Upload cancelado');
      } catch (error) {
        console.error('Error canceling upload:', error);
      }
    }
  }, [uploadSessionId, currentPhase]);

  // Reintentar upload
  const handleRetryUpload = useCallback(() => {
    if (selectedFile) {
      resetUploader();
      setTimeout(() => {
        handleFileUpload(selectedFile);
      }, 100);
    }
  }, [selectedFile, handleFileUpload]);

  // Selección manual de archivo
  const handleManualSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = fileConfig.accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const validationError = validateFile(file);
        if (validationError) {
          message.error(validationError);
          return;
        }
        setSelectedFile(file);
        setError(null);
        onUploadStart?.(file);
        handleFileUpload(file);
      }
    };
    input.click();
  };

  // Cerrar modal
  const handleCloseModal = useCallback(() => {
    // Cancelar upload si está en progreso
    if (currentPhase === 'uploading' && uploadSessionId) {
      handleCancelUpload();
    }
    
    setModalOpen(false);
    onModalClose?.();
    // Reset después de cerrar para evitar parpadeos
    setTimeout(resetUploader, 300);
  }, [currentPhase, uploadSessionId, handleCancelUpload, onModalClose]);

  // Resetear uploader
  const resetUploader = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setProcessingProgress(0);
    setCurrentPhase('idle');
    setCurrentStep('');
    setError(null);
    setUploadSessionId(null);
    setUploadProgressInfo(null);
    uploadStartTime.current = 0;
    lastProgressUpdate.current = 0;
    speedHistory.current = [];
    setProcessingSteps(prev => prev.map(s => ({ ...s, status: 'wait' as const })));
  };

  // Renderizar información de progreso detallada
  const renderUploadProgressInfo = () => {
    if (!uploadProgressInfo || currentPhase !== 'uploading') return null;

    return (
      <Card 
        size="small"
        style={{ 
          marginTop: '16px',
          backgroundColor: isDark ? token.colorBgElevated : '#f8f9ff',
          border: `1px solid ${isDark ? token.colorBorder : '#e8eaed'}`
        }}
      >
        <Row gutter={[16, 8]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="Subido"
              value={formatBytes(uploadProgressInfo.uploadedBytes)}
              valueStyle={{ fontSize: isSmallScreen ? '12px' : '14px', color: FIXED_COLOR }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Total"
              value={formatBytes(uploadProgressInfo.totalBytes)}
              valueStyle={{ fontSize: isSmallScreen ? '12px' : '14px', color: isDark ? token.colorText : '#666' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Velocidad"
              value={formatBytes(uploadProgressInfo.speed) + '/s'}
              valueStyle={{ fontSize: isSmallScreen ? '12px' : '14px', color: isDark ? token.colorSuccess : '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Tiempo restante"
              value={formatTimeRemaining(uploadProgressInfo.timeRemaining)}
              valueStyle={{ fontSize: isSmallScreen ? '12px' : '14px', color: isDark ? token.colorWarning : '#fa8c16' }}
            />
          </Col>
        </Row>
        
        {uploadProgressInfo.totalChunks > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Text style={{ fontSize: '12px', color: isDark ? token.colorTextSecondary : '#999' }}>
              Chunks: {uploadProgressInfo.chunksUploaded} / {uploadProgressInfo.totalChunks}
            </Text>
          </>
        )}
      </Card>
    );
  };

  // Renderizar pasos de procesamiento
  const renderProcessingSteps = () => {
    if (currentPhase === 'idle') return null;

    return (
      <div style={{ marginTop: '24px' }}>
        <Title 
          level={5} 
          style={{ 
            color: FIXED_COLOR, 
            marginBottom: '16px',
            fontSize: isSmallScreen ? '14px' : '16px'
          }}
        >
          {currentPhase === 'uploading' ? 'Progreso de Subida' : 'Progreso del Procesamiento'}
        </Title>
        
        <Steps 
          direction={isSmallScreen ? "vertical" : "vertical"}
          size={isSmallScreen ? "small" : "default"}
          current={processingSteps.findIndex(s => s.status === 'process')}
        >
          {processingSteps.map((step) => (
            <Step
              key={step.key}
              title={<span style={{ fontSize: isSmallScreen ? '12px' : '14px' }}>{step.title}</span>}
              description={
                <span style={{ fontSize: isSmallScreen ? '11px' : '12px' }}>
                  {step.description}
                </span>
              }
              status={step.status}
              icon={
                step.status === 'process' ? <LoadingOutlined /> :
                step.status === 'error' ? <ExclamationCircleOutlined /> :
                step.status === 'finish' ? <CheckCircleOutlined /> : undefined
              }
            />
          ))}
        </Steps>
        
        {currentStep && (
          <Alert
            message={currentStep}
            type={currentPhase === 'error' ? 'error' : 'info'}
            showIcon
            style={{ 
              marginTop: '16px',
              fontSize: isSmallScreen ? '12px' : '14px'
            }}
          />
        )}
      </div>
    );
  };

  // Renderizar controles del upload
  const renderUploadControls = () => {
    if (currentPhase === 'idle' || currentPhase === 'success') return null;

    return (
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Space>
          {currentPhase === 'uploading' && (
            <Button
              icon={<StopOutlined />}
              onClick={handleCancelUpload}
              danger
              size={isSmallScreen ? "small" : "middle"}
            >
              Cancelar
            </Button>
          )}
          
          {currentPhase === 'error' && (
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRetryUpload}
              type="primary"
              size={isSmallScreen ? "small" : "middle"}
            >
              Reintentar
            </Button>
          )}
        </Space>
      </div>
    );
  };

  return (
    <>
      {/* Botón de subida */}
      <Button
        {...getButtonProps()}
        onClick={handleButtonClick}
        loading={currentPhase === 'uploading' || currentPhase === 'processing'}
      >
        {showText && 'Subir Archivo'}
      </Button>

      {/* Modal de subida */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: isDark ? '#ffffff' : FIXED_COLOR,
            fontSize: '18px',
            fontWeight: '600'
          }}>
            {title}
          </div>
        }
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        centered
        width={modalWidth}
        destroyOnClose={false}
        styles={{
          header: {
            backgroundColor: isDark ? token.colorBgContainer : '#f8f9ff',
            borderBottom: `1px solid ${isDark ? token.colorBorder : '#e8eaed'}`
          },
          body: {
            padding: isSmallScreen ? '16px' : '24px'
          }
        }}
      >
        <div style={{ padding: isSmallScreen ? '16px 0' : '24px 0' }}>
          {currentPhase === 'idle' ? (
            <>
              {/* Zona de arrastre */}
              <Dragger
                name="file"
                multiple={false}
                accept={fileConfig.accept}
                beforeUpload={handleFileSelect}
                showUploadList={false}
                style={{
                  border: `2px dashed ${isDark ? token.colorBorder : '#7A85C1'}`,
                  borderRadius: '8px',
                  backgroundColor: isDark ? token.colorBgElevated : '#F8F9FB',
                  padding: isSmallScreen ? '20px 16px' : '40px 20px',
                  cursor: 'pointer'
                }}
              >
                <p className="ant-upload-drag-icon">
                  <CloudUploadOutlined style={{ 
                    fontSize: isSmallScreen ? '36px' : '48px', 
                    color: isDark ? '#5b6ef0' : '#3B38A0' 
                  }} />
                </p>
                <p className="ant-upload-text" style={{ 
                  color: isDark ? '#ffffff' : '#1A2A80', 
                  fontSize: isSmallScreen ? '14px' : '16px', 
                  fontWeight: '500',
                  margin: isSmallScreen ? '12px 0 6px 0' : '16px 0 8px 0'
                }}>
                  {isSmallScreen ? 'Toca o arrastra aquí' : 'Haz clic o arrastra el archivo aquí'}
                </p>
                <p className="ant-upload-hint" style={{ 
                  color: isDark ? '#bfc7ff' : '#7A85C1',
                  fontSize: isSmallScreen ? '12px' : '14px',
                  margin: '0',
                  padding: isSmallScreen ? '0 8px' : '0'
                }}>
                  {fileConfig.validationMessage || 
                   `Archivos aceptados: ${fileConfig.accept}. Tamaño máximo: ${(fileConfig.maxSize / 1024 / 1024).toFixed(1)}MB`}
                </p>
              </Dragger>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleManualSelect}
                  style={{
                    backgroundColor: 'var(--ant-color-primary)',
                    borderColor: 'var(--ant-color-primary)',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}
                  size={isSmallScreen ? "middle" : "large"}
                >
                  {isSmallScreen ? 'Seleccionar' : 'Seleccionar Archivo'}
                </Button>
              </div>
            </>
          ) : currentPhase === 'success' ? (
            <div style={{ 
              textAlign: 'center', 
              padding: isSmallScreen ? '30px 16px' : '40px 20px',
              backgroundColor: isDark ? token.colorBgElevated : '#f6ffed',
              borderRadius: '8px',
              border: `2px solid ${isDark ? token.colorSuccess : 'var(--ant-color-success)'}`
            }}>
              <CheckCircleOutlined style={{ 
                fontSize: isSmallScreen ? '48px' : '64px', 
                color: isDark ? token.colorSuccess : '#52c41a', 
                marginBottom: isSmallScreen ? '12px' : '16px',
                display: 'block'
              }} />
              
              <Text style={{ 
                color: isDark ? token.colorSuccess : '#389e0d', 
                fontSize: isSmallScreen ? '16px' : '18px', 
                fontWeight: '600',
                display: 'block',
                marginBottom: '8px'
              }}>
                {successText}
              </Text>

              {selectedFile && (
                <Text style={{ 
                  color: isDark ? token.colorTextSecondary : '#666', 
                  fontSize: isSmallScreen ? '12px' : '14px',
                  display: 'block',
                  marginBottom: '16px'
                }}>
                  "{selectedFile.name}" está listo
                </Text>
              )}

              <Button
                type="primary"
                onClick={handleCloseModal}
                style={{
                  backgroundColor: isDark ? token.colorSuccess : 'var(--ant-color-success)',
                  borderColor: isDark ? token.colorSuccess : 'var(--ant-color-success)',
                  marginTop: '16px'
                }}
                size={isSmallScreen ? "middle" : "large"}
              >
                Cerrar
              </Button>
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: isSmallScreen ? '30px 16px' : '40px 20px',
              backgroundColor: isDark ? token.colorBgElevated : '#F8F9FB',
              borderRadius: '8px',
              border: `2px solid ${currentPhase === 'error' ? 
                (isDark ? token.colorError : '#ff4d4f') : 
                (isDark ? token.colorBorder : '#7A85C1')}`
            }}>
              {currentPhase === 'error' ? (
                <CloseCircleOutlined style={{ 
                  fontSize: isSmallScreen ? '36px' : '48px', 
                  color: isDark ? token.colorError : '#ff4d4f', 
                  marginBottom: isSmallScreen ? '12px' : '16px' 
                }} />
              ) : (
                <FileAddOutlined style={{ 
                  fontSize: isSmallScreen ? '36px' : '48px', 
                  color: '#3B38A0', 
                  marginBottom: isSmallScreen ? '12px' : '16px' 
                }} />
              )}
              
              {selectedFile && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: '4px',
                    flexWrap: isSmallScreen ? 'wrap' : 'nowrap'
                  }}>
                    <FileTextOutlined style={{ 
                      color: '#1A2A80', 
                      marginRight: '8px', 
                      fontSize: isSmallScreen ? '14px' : '16px' 
                    }} />
                    <Text strong style={{ 
                      color: '#1A2A80',
                      fontSize: isSmallScreen ? '12px' : '14px',
                      wordBreak: 'break-word',
                      textAlign: 'center'
                    }}>
                      {selectedFile.name}
                    </Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: isSmallScreen ? '11px' : '12px' }}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </div>
              )}

              <Text style={{ 
                color: currentPhase === 'error' ? 
                  (isDark ? token.colorError : '#ff4d4f') : '#1A2A80', 
                fontSize: isSmallScreen ? '14px' : '16px', 
                fontWeight: '500',
                display: 'block',
                marginBottom: '16px'
              }}>
                {currentPhase === 'error' ? 'Error en la subida' : 
                 currentPhase === 'uploading' ? 'Subiendo archivo...' : processingText}
              </Text>

              {/* Progreso de upload */}
              {currentPhase === 'uploading' && (
                <Progress
                  percent={uploadProgress}
                  strokeColor="#3B38A0"
                  trailColor="#E6E6E6"
                  style={{ 
                    maxWidth: isSmallScreen ? '250px' : '300px', 
                    margin: '0 auto 16px auto' 
                  }}
                  size={isSmallScreen ? "small" : "default"}
                />
              )}

              {/* Progreso de procesamiento */}
              {currentPhase === 'processing' && (
                <Progress
                  percent={processingProgress}
                  strokeColor="#3B38A0"
                  trailColor="#E6E6E6"
                  style={{ 
                    maxWidth: isSmallScreen ? '250px' : '300px', 
                    margin: '0 auto 16px auto' 
                  }}
                  size={isSmallScreen ? "small" : "default"}
                />
              )}

              {/* Información detallada de progreso */}
              {renderUploadProgressInfo()}

              {/* Pasos de procesamiento */}
              {renderProcessingSteps()}

              {/* Controles */}
              {renderUploadControls()}

              {/* Error específico */}
              {error && (
                <Alert
                  message="Error en el procesamiento"
                  description={error}
                  type="error"
                  showIcon
                  style={{ 
                    marginTop: '16px', 
                    textAlign: 'left',
                    fontSize: isSmallScreen ? '12px' : '14px'
                  }}
                />
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ChunkedUploadButton;

// Exportar tipos para uso externo
export type { 
  ChunkedUploadButtonProps,
  FileConfig, 
  ProcessingConfig, 
  ProcessingStep, 
  ButtonConfig, 
  ModalConfig,
  UploadProgressInfo
};
