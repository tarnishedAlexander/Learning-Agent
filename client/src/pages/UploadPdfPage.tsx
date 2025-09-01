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
      backgroundColor: "#f5f7fa",
      minHeight: "100vh",
      marginRight: previewSidebarVisible ? "50%" : "0",
      transition: "margin-right 0.3s ease-in-out"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header Section */}
        <div style={{ marginBottom: "24px" }}>
          <Title 
            level={2}
            style={{ 
              color: "#1A2A80", 
              marginBottom: "8px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}
          >
            <FileTextOutlined />
            Gestión de Documentos Académicos
          </Title>
          <Text 
            style={{ 

              color: "var(--subtitle-color, #bfc7ff)", 
              fontSize: "16px",
              fontWeight: "400"
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
                  color: "#1A2A80"
                }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <FileTextOutlined style={{ marginRight: "12px", fontSize: "20px" }} />
                    <span style={{ fontSize: "18px", fontWeight: "500" }}>
                      Repositorio de Documentos
                    </span>
                    <div style={{
                      marginLeft: "16px",
                      backgroundColor: documents.length > 0 ? "#E8F4FD" : "#F0F0F0",
                      color: documents.length > 0 ? "#3B38A0" : "#666",
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
                        
                        const result = await uploadDocument(file);
                        
                        if (onProgress) {
                          onProgress("store", 100, "¡Documento almacenado exitosamente!");
                        }
                        
                        return result;
                      } catch (error) {
                        console.error("Error uploading document:", error);
                        throw error;
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
                boxShadow: "0 4px 16px rgba(26, 42, 128, 0.1)",
                border: "1px solid #e8eaed"
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