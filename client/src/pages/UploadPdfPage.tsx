import React, { useCallback, useState } from "react";
import { Card, message, Typography, Row, Col } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import UploadButton from "../components/shared/UploadButton";
import { DocumentTable } from "../components/documents/DocumentTable";
import { PdfPreviewSidebar } from "../components/documents/PdfPreviewSidebar";
import { useDocuments } from "../hooks/useDocuments";
import type { Document } from "../interfaces/documentInterface";
   
const { Title, Text } = Typography;

const UploadPdfPage: React.FC = () => {
  const { documents, loading, downloadDocument, deleteDocument, loadDocuments, uploadDocument } = useDocuments();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Estados para el sidebar de previsualización
  const [previewSidebarVisible, setPreviewSidebarVisible] = useState<boolean>(false);
  const [documentToPreview, setDocumentToPreview] = useState<Document | null>(null);

  const handleUploadSuccess = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDocuments();
    } catch (error) {
      console.error("Error actualizando tabla:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadDocuments]);

  const handleDownload = useCallback(async (doc: Document) => {
    try {
      await downloadDocument(doc);
      message.success("Archivo descargado correctamente");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al descargar";
      message.error(errorMessage);
    }
  }, [downloadDocument]);

  // Simplificamos el manejo de eliminación - ya no necesitamos estados del modal
  const handleDeleteSuccess = useCallback(() => {
    message.success("Documento eliminado exitosamente");
    loadDocuments(); // Refrescar la lista
  }, [loadDocuments]);

  const handleDeleteError = useCallback((error: Error) => {
    message.error(error.message);
  }, []);

  const handlePreview = useCallback((doc: Document) => {
    setDocumentToPreview(doc);
    setPreviewSidebarVisible(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setPreviewSidebarVisible(false);
    setDocumentToPreview(null);
  }, []);

  return (
    <div style={{ 
      padding: "32px", 
      minHeight: "100vh",
      marginRight: previewSidebarVisible ? "50%" : "0",
      transition: "margin-right 0.3s ease-in-out"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header Section */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <Title 
            level={1} 
            style={{ 
              marginBottom: "8px",
              fontSize: "32px",
              fontWeight: "600"
            }}
          >
            <FileTextOutlined style={{ marginRight: "12px" }} />
            Gestión de Documentos Académicos
          </Title>
          <Text 
            style={{ 
              fontSize: "16px",
              fontWeight: "400",
              opacity: 0.85
            }}
          >
            Sistema de carga y administración de material educativo en formato PDF
          </Text>
        </div>

        {/* Documents Table Section */}
        <Row>
          <Col xs={24}>
            <Card
              title={
                <div style={{ 
                  display: "flex", 
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "inherit"
                }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <FileTextOutlined style={{ marginRight: "12px", fontSize: "20px" }} />
                    <span style={{ fontSize: "18px", fontWeight: "500" }}>
                      Repositorio de Documentos
                    </span>
                    <div style={{
                      marginLeft: "16px",
                      backgroundColor: documents.length > 0 ? "var(--ant-color-primary-bg)" : "rgba(0, 0, 0, 0.04)",
                      color: documents.length > 0 ? "var(--ant-color-primary)" : "var(--ant-color-text-disabled)",
                      padding: "4px 12px",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "500",
                      transition: "all 0.3s ease"
                    }}>
                      {loading || refreshing ? "Actualizando..." : `${documents.length} documento${documents.length !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                  <UploadButton
                    fileConfig={{
                      accept: ".pdf",
                      maxSize: 10 * 1024 * 1024, // 10MB
                      validationMessage: "Solo se permiten archivos PDF de hasta 10MB"
                    }}
                    processingConfig={{
                      steps: [
                        { key: "validate", title: "Validación", description: "Validando formato PDF..." },
                        { key: "extract", title: "Extracción", description: "Extrayendo contenido..." },
                        { key: "process", title: "Procesamiento", description: "Procesando documento..." },
                        { key: "store", title: "Almacenamiento", description: "Almacenando información..." }
                      ],
                      processingText: "Procesando documento PDF...",
                      successText: "¡Documento procesado exitosamente!"
                    }}
                    buttonConfig={{
                      showText: true,
                      variant: "fill",
                      size: "middle",
                      shape: "default"
                    }}
                    modalConfig={{
                      title: "Cargar Nuevo Documento",
                      width: 600
                    }}
                    onUpload={async (file, onProgress) => {
                      try {
                        if (onProgress) {
                          onProgress("validate", 25, "Validando formato PDF...");
                          await new Promise(resolve => setTimeout(resolve, 500));
                          
                          onProgress("extract", 50, "Extrayendo contenido...");
                          await new Promise(resolve => setTimeout(resolve, 500));
                          
                          onProgress("process", 75, "Procesando documento...");
                        }
                        
                        const document = await uploadDocument(file);
                        
                        if (onProgress) {
                          onProgress("store", 100, "¡Documento almacenado exitosamente!");
                        }
                        
                        return {
                          success: true,
                          fileUrl: document.downloadUrl,
                          fileId: document.id,
                          document: document
                        };
                      } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Error en el procesamiento';
                        return {
                          success: false,
                          error: errorMessage
                        };
                      }
                    }}
                    onUploadSuccess={() => {
                      handleUploadSuccess();
                    }}
                  />
                </div>
              }
              style={{
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                border: "1px solid"
              }}
            >
              <DocumentTable
                key={`documents-table-${documents.length}`}
                documents={documents}
                loading={loading || refreshing}
                onDownload={handleDownload}
                onDelete={deleteDocument}
                onPreview={handlePreview}
                onDeleteSuccess={handleDeleteSuccess}
                onDeleteError={handleDeleteError}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Sidebar de previsualización de PDF */}
      <PdfPreviewSidebar
        document={documentToPreview}
        visible={previewSidebarVisible}
        onClose={handleCloseSidebar}
      />
    </div>
  );
};

export default UploadPdfPage;