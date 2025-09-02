import React, { useCallback, useState } from "react";
import { Card, message, Row, Col, theme as antTheme } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import PageTemplate from "../components/PageTemplate";
import UploadButton from "../components/shared/UploadButton";
import { DocumentTable } from "../components/documents/DocumentTable";
import { PdfPreviewSidebar } from "../components/documents/PdfPreviewSidebar";
import { DocumentDataSidebar } from "../components/documents/DocumentDataSidebar";
import { useDocuments } from "../hooks/useDocuments";
import { useThemeStore } from "../store/themeStore";
import type { Document } from "../interfaces/documentInterface";

const UploadPdfPage: React.FC = () => {
  const { documents, loading, downloadDocument, deleteDocument, loadDocuments, processDocumentComplete } = useDocuments();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Theme
  const theme = useThemeStore((state: { theme: string }) => state.theme);
  const isDark = theme === "dark";
  const { token } = antTheme.useToken();
  
  // Estados para el sidebar de previsualización
  const [previewSidebarVisible, setPreviewSidebarVisible] = useState<boolean>(false);
  const [documentToPreview, setDocumentToPreview] = useState<Document | null>(null);
  
  // Estados para el sidebar de datos
  const [dataSidebarVisible, setDataSidebarVisible] = useState<boolean>(false);
  const [documentToViewData, setDocumentToViewData] = useState<Document | null>(null);

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

  const handleViewData = useCallback((doc: Document) => {
    // Si el preview está abierto, cerrarlo primero para evitar conflictos
    if (previewSidebarVisible) {
      setPreviewSidebarVisible(false);
      setDocumentToPreview(null);
    }
    setDocumentToViewData(doc);
    setDataSidebarVisible(true);
  }, [previewSidebarVisible]);

  const handleCloseDataSidebar = useCallback(() => {
    setDataSidebarVisible(false);
    setDocumentToViewData(null);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setPreviewSidebarVisible(false);
    setDocumentToPreview(null);
  }, []);

  const handlePreview = useCallback((doc: Document) => {
    // Si el data sidebar está abierto, cerrarlo primero para evitar conflictos
    if (dataSidebarVisible) {
      setDataSidebarVisible(false);
      setDocumentToViewData(null);
    }
    setDocumentToPreview(doc);
    setPreviewSidebarVisible(true);
  }, [dataSidebarVisible]);
  

  return (
    <div>
      <PageTemplate
        title="Documentos"
        subtitle="Sistema de carga y administración de material educativo en formato PDF"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Documentos" }]}
      >
        <div
          className="w-full lg:max-w-6xl lg:mx-auto space-y-4 sm:space-y-6"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "24px 24px"
          }}
        >
        {/* Documents Table Section */}
        <Row>
          <Col xs={24}>
            <Card
              title={
                <div style={{ 
                  display: "flex", 
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: isDark ? token.colorText : "#1A2A80"
                }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <FileTextOutlined style={{ marginRight: "12px", fontSize: "20px" }} />
                    <span style={{ fontSize: "18px", fontWeight: "500" }}>
                      Repositorio de Documentos
                    </span>
                    <div style={{
                      marginLeft: "16px",
                      backgroundColor: documents.length > 0 
                        ? (isDark ? token.colorPrimaryBg : "#E8F4FD") 
                        : (isDark ? token.colorBgTextHover : "#F0F0F0"),
                      color: documents.length > 0 
                        ? (isDark ? token.colorPrimary : "#3B38A0") 
                        : (isDark ? token.colorTextSecondary : "#666"),
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
                        // Usar processDocumentComplete que incluye upload + procesamiento + chunks
                        const result = await processDocumentComplete(file, onProgress);
                        return result;
                      } catch (error) {
                        
                        console.error("Error processing document:", error);
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
                boxShadow: isDark 
                  ? "0 4px 16px rgba(91, 110, 240, 0.1)" 
                  : "0 4px 16px rgba(26, 42, 128, 0.1)",
                border: `1px solid ${isDark ? token.colorBorder : "#e8eaed"}`,
                backgroundColor: isDark ? token.colorBgContainer : "#FFFFFF"
              }}
            >
              <DocumentTable
                key={`documents-table-${documents.length}`}
                documents={documents}
                loading={loading || refreshing}
                onDownload={handleDownload}
                onDelete={deleteDocument}
                onPreview={handlePreview}
                onViewData={handleViewData}
                onDeleteSuccess={handleDeleteSuccess}
                onDeleteError={handleDeleteError}
              />
            </Card>
          </Col>
        </Row>
        </div>
      </PageTemplate>

      {/* Sidebar de previsualización de PDF */}
      <PdfPreviewSidebar
        document={documentToPreview}
        visible={previewSidebarVisible}
        onClose={handleCloseSidebar}
      />

      {/* Sidebar de datos del documento */}
      <DocumentDataSidebar
        document={documentToViewData}
        visible={dataSidebarVisible}
        onClose={handleCloseDataSidebar}
      />
    </div>
  );
};

export default UploadPdfPage;