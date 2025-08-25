import React, { useState } from "react";
import { Upload, Button, message, Progress, Typography, notification } from "antd";
import { CloudUploadOutlined, FileAddOutlined, PlusOutlined, CheckCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import type { RcFile } from "rc-upload/lib/interface";
import { useDocuments } from "../hooks/useDocuments";

const { Dragger } = Upload;
const { Text } = Typography;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploaderProps {
  onUploadSuccess?: () => void;
}

const Uploader: React.FC<UploaderProps> = ({ onUploadSuccess }) => {
  const { uploadDocument } = useDocuments();
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

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
    handleUpload(file);
    return false; // Prevenir la subida automática
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setProgress(0);

      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const uploadedDocument = await uploadDocument(file);

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        // Mostrar estado de éxito
        setUploadSuccess(true);
        setProgress(100);
        
        // Llamar callback para forzar actualización si está disponible
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        
        // Mostrar notificación de éxito
        notification.success({
          message: "¡Documento subido exitosamente!",
          description: `"${uploadedDocument.originalName}" se agregó al repositorio y la tabla se actualizó`,
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          placement: "topRight",
          duration: 5,
          style: {
            backgroundColor: "#f6ffed",
            border: "1px solid #b7eb8f"
          }
        });

        // Resetear estado después de mostrar el éxito
        setTimeout(() => {
          setSelectedFile(null);
          setProgress(0);
          setUploading(false);
          setUploadSuccess(false);
        }, 2000);
      }, 500);

    } catch (error) {
      setUploading(false);
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : "Error al subir el documento";
      
      notification.error({
        message: "Error al subir documento",
        description: errorMessage,
        placement: "topRight",
        duration: 5,
        style: {
          backgroundColor: "#fff2f0",
          border: "1px solid #ffccc7"
        }
      });
    }
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
        handleUpload(file);
      }
    };
    input.click();
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
              Solo se permiten archivos PDF. Tamaño máximo: 10MB
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
            ¡Documento subido exitosamente!
          </Text>

          {selectedFile && (
            <Text style={{ 
              color: "#666", 
              fontSize: "14px",
              display: "block"
            }}>
              "{selectedFile.name}" se agregó al repositorio
            </Text>
          )}
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
            Subiendo documento...
          </Text>

          <Progress
            percent={progress}
            strokeColor="#3B38A0"
            trailColor="#E6E6E6"
            style={{ maxWidth: "300px", margin: "0 auto" }}
          />
        </div>
      )}
    </div>
  );
};

export default Uploader;
