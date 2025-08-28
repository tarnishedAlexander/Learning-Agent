import React, { useState } from "react";
import { Upload, Button, message, Progress, Typography, notification, Steps, Alert, Collapse, Space, Tag } from "antd";
import { 
  CloudUploadOutlined, 
  FileAddOutlined, 
  PlusOutlined, 
  CheckCircleOutlined, 
  FileTextOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import type { RcFile } from "rc-upload/lib/interface";
import { useDocuments } from "../hooks/useDocuments";

const { Dragger } = Upload;
const { Text, Title } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploaderProps {
  onUploadSuccess?: () => void;
}

interface ProcessingStep {
  key: string;
  title: string;
  description: string;
  status: 'wait' | 'process' | 'finish' | 'error';
  timeMs?: number;
}

const Uploader: React.FC<UploaderProps> = ({ onUploadSuccess }) => {
  const { processDocumentComplete } = useDocuments();
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { key: 'upload', title: 'Subir Archivo', description: 'Subiendo documento al servidor', status: 'wait' },
    { key: 'text', title: 'Extraer Texto', description: 'Extrayendo texto del PDF', status: 'wait' },
    { key: 'chunks', title: 'Dividir en Chunks', description: 'Segmentando el documento', status: 'wait' },
    { key: 'embeddings', title: 'Generar Embeddings', description: 'Creando vectores semánticos', status: 'wait' },
  ]);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Verificar tipo de archivo
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return "Solo se permiten archivos PDF";
    }

    // Verificar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo es demasiado grande. Máximo permitido: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)} MB`;
    }

    return null;
  };

  const handleFileSelect = (file: RcFile): boolean => {
    const validationError = validateFile(file);
    if (validationError) {
      message.error(validationError);
      return false;
    }

    setSelectedFile(file);
    setError(null);
    handleCompleteProcessing(file);
    return false; // Prevenir la subida automática
  };

  const handleCompleteProcessing = async (file: File) => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      const result = await processDocumentComplete(file, (step, progress, message) => {
        setCurrentStep(message);
        setProgress(progress);
        
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
      });

      setProcessingResult(result);
      setUploadSuccess(true);
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
      notification.success({
        message: "¡Procesamiento completado!",
        description: `Documento procesado: ${result.chunksCreated} chunks creados, ${result.embeddingsGenerated} embeddings generados`,
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        placement: "topRight",
        duration: 8,
      });

      setTimeout(() => {
        resetUploader();
      }, 5000);

    } catch (error) {
      setUploading(false);
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : "Error en el procesamiento completo";
      setError(errorMessage);
      
      // Marcar el paso actual como error
      setProcessingSteps(prev => prev.map(s => 
        s.status === 'process' ? { ...s, status: 'error' } : s
      ));
      
      notification.error({
        message: "Error en el procesamiento",
        description: errorMessage,
        placement: "topRight",
        duration: 8,
      });
    }
  };

  const resetUploader = () => {
    setSelectedFile(null);
    setProgress(0);
    setUploading(false);
    setUploadSuccess(false);
    setCurrentStep('');
    setProcessingResult(null);
    setError(null);
    setProcessingSteps(prev => prev.map(s => ({ ...s, status: 'wait' as const })));
  };

  const handleManualSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,application/pdf";
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
        handleCompleteProcessing(file);
      }
    };
    input.click();
  };

  const formatTime = (ms: number) => {
    return ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  };

  const renderProcessingSteps = () => {
    if (!uploading && !uploadSuccess) return null;

    return (
      <div style={{ marginTop: "24px" }}>
        <Title level={5} style={{ color: "#1A2A80", marginBottom: "16px" }}>
          Progreso del Procesamiento
        </Title>
        <Steps 
          direction="vertical" 
          size="small"
          current={processingSteps.findIndex(s => s.status === 'process')}
        >
          {processingSteps.map((step, _index) => (
            <Step
              key={step.key}
              title={step.title}
              description={step.description}
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
            type="info"
            showIcon
            style={{ marginTop: "16px" }}
          />
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!processingResult) return null;

    return (
      <Collapse style={{ marginTop: "16px" }}>
        <Panel header="Detalles del Procesamiento" key="1">
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>Estadísticas:</Text>
              <div style={{ marginLeft: "16px", marginTop: "8px" }}>
                <Tag color="blue">Chunks: {processingResult.chunksCreated}</Tag>
                <Tag color="green">Embeddings: {processingResult.embeddingsGenerated}</Tag>
                <Tag color="purple">
                  Tiempo total: {formatTime(processingResult.processingStats.totalTimeMs)}
                </Tag>
              </div>
            </div>
            
            <div>
              <Text strong>Tiempos por etapa:</Text>
              <div style={{ marginLeft: "16px", marginTop: "8px" }}>
                <div>• Extracción de texto: {formatTime(processingResult.processingStats.textExtractionTimeMs)}</div>
                <div>• Chunking: {formatTime(processingResult.processingStats.chunkingTimeMs)}</div>
                <div>• Embeddings: {formatTime(processingResult.processingStats.embeddingTimeMs)}</div>
              </div>
            </div>
          </Space>
        </Panel>
      </Collapse>
    );
  };

  return (
    <div style={{ width: "100%" }}>
      {!uploading && !uploadSuccess ? (
        <>
          <Dragger
            name="file"
            multiple={false}
            accept=".pdf,application/pdf"
            beforeUpload={handleFileSelect}
            showUploadList={false}
            style={{
              border: "2px dashed #7A85C1",
              borderRadius: "8px",
              backgroundColor: "#F8F9FB",
              padding: "40px 20px",
              cursor: "pointer"
            }}
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ fontSize: "48px", color: "#3B38A0" }} />
            </p>
            <p className="ant-upload-text" style={{ 
              color: "#1A2A80", 
              fontSize: "16px", 
              fontWeight: "500",
              margin: "16px 0 8px 0"
            }}>
              Haz clic o arrastra el archivo PDF aquí
            </p>
            <p className="ant-upload-hint" style={{ 
              color: "#7A85C1",
              fontSize: "14px",
              margin: "0"
            }}>
              Procesamiento completo: extracción de texto + chunks + embeddings. Tamaño máximo: 10MB
            </p>
          </Dragger>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleManualSelect}
              style={{
                backgroundColor: "#3B38A0",
                borderColor: "#3B38A0",
                borderRadius: "6px",
                fontWeight: "500"
              }}
              size="large"
            >
              Seleccionar Archivo
            </Button>
          </div>
        </>
      ) : uploadSuccess ? (
        <div style={{ 
          textAlign: "center", 
          padding: "40px 20px",
          backgroundColor: "#f6ffed",
          borderRadius: "8px",
          border: "2px solid #52c41a"
        }}>
          <CheckCircleOutlined style={{ 
            fontSize: "64px", 
            color: "#52c41a", 
            marginBottom: "16px",
            display: "block"
          }} />
          
          <Text style={{ 
            color: "#389e0d", 
            fontSize: "18px", 
            fontWeight: "600",
            display: "block",
            marginBottom: "8px"
          }}>
            ¡Procesamiento completado!
          </Text>

          {selectedFile && (
            <Text style={{ 
              color: "#666", 
              fontSize: "14px",
              display: "block",
              marginBottom: "16px"
            }}>
              "{selectedFile.name}" está listo para búsquedas semánticas
            </Text>
          )}

          {renderResults()}
        </div>
      ) : (
        <div style={{ 
          textAlign: "center", 
          padding: "40px 20px",
          backgroundColor: "#F8F9FB",
          borderRadius: "8px",
          border: "2px solid #7A85C1"
        }}>
          <FileAddOutlined style={{ fontSize: "48px", color: "#3B38A0", marginBottom: "16px" }} />
          
          {selectedFile && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                <FileTextOutlined style={{ color: "#1A2A80", marginRight: "8px", fontSize: "16px" }} />
                <Text strong style={{ color: "#1A2A80" }}>
                  {selectedFile.name}
                </Text>
              </div>
              <Text type="secondary" style={{ fontSize: "12px", marginLeft: "24px" }}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </div>
          )}

          <Text style={{ 
            color: "#1A2A80", 
            fontSize: "16px", 
            fontWeight: "500",
            display: "block",
            marginBottom: "16px"
          }}>
            Procesando documento...
          </Text>

          <Progress
            percent={progress}
            strokeColor="#3B38A0"
            trailColor="#E6E6E6"
            style={{ maxWidth: "300px", margin: "0 auto 24px auto" }}
          />

          {renderProcessingSteps()}

          {error && (
            <Alert
              message="Error en el procesamiento"
              description={error}
              type="error"
              showIcon
              style={{ marginTop: "16px", textAlign: "left" }}
              action={
                <Button size="small" onClick={resetUploader}>
                  Reintentar
                </Button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Uploader;
