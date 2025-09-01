import React, { useCallback, useState } from "react";
import { Card, message, Typography, Row, Col, Grid } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import UploadButton from "../components/shared/UploadButton";
import { DocumentTable } from "../components/documents/DocumentTable";
import { useThemeStore } from "../store/themeStore";
import { PdfPreviewSidebar } from "../components/documents/PdfPreviewSidebar";
import { DocumentDataSidebar } from "../components/documents/DocumentDataSidebar";
import { useDocuments } from "../hooks/useDocuments";
import type { Document } from "../interfaces/documentInterface";
   
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const UploadPdfPage: React.FC = () => {
  const { documents, loading, downloadDocument, deleteDocument, loadDocuments, uploadDocument } = useDocuments();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const screens = useBreakpoint();
  
  // Estados para el sidebar de previsualización
  const [previewSidebarVisible, setPreviewSidebarVisible] = useState<boolean>(false);
  const [documentToPreview, setDocumentToPreview] = useState<Document | null>(null);
  
  // Estados para el sidebar de datos
  const [dataSidebarVisible, setDataSidebarVisible] = useState<boolean>(false);
  const [documentToViewData, setDocumentToViewData] = useState<Document | null>(null);

  // Configuración responsiva
  const isSmallScreen = !screens.lg;
  const sidebarWidth = isSmallScreen ? '100%' : '50%';

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

  const theme = useThemeStore(state => state.theme);
  const isDark = theme === "dark";

  return (
    <div style={{ 
      padding: isSmallScreen ? "16px" : "32px", 
      backgroundColor: isDark ? "#0b1024" : "#f5f7fa",
      minHeight: "100vh",
      marginRight: (previewSidebarVisible || dataSidebarVisible) 
        ? (window.innerWidth <= 768 ? "0" : "50%") 
        : "0",
      transition: "all 0.3s ease-in-out"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header Section */}
        <div style={{ marginBottom: isSmallScreen ? "24px" : "32px", textAlign: "center" }}>
          <Title 
            level={isSmallScreen ? 2 : 1} 
            style={{ 
              color: isDark ? "#5b6ef0" : "#1A2A80",
              marginBottom: "8px",
              fontSize: isSmallScreen ? "24px" : "32px",
              fontWeight: "600"
            }}
          >
            <FileTextOutlined style={{ marginRight: "12px" }} />
            {isSmallScreen ? "Documentos Académicos" : "Gestión de Documentos Académicos"}
          </Title>
          <Text 
            style={{ 
              color: isDark ? "#bfc7ff" : "#7A85C1",
              fontSize: isSmallScreen ? "14px" : "16px",
              fontWeight: "400",
              display: "block",
              maxWidth: isSmallScreen ? "100%" : "80%",
              margin: "0 auto"
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
                isSmallScreen ? (
                  // Vista móvil - layout horizontal centrado
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    color: isDark ? "#ffffff" : "#1A2A80",
                    flexWrap: "wrap"
                  }}>
                    {/* Título con ícono */}
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <FileTextOutlined style={{ 
                        fontSize: "16px",
                        color: isDark ? "#5b6ef0" : "#1A2A80"
                      }} />
                      <span style={{ 
                        fontSize: "16px", 
                        fontWeight: "500"
                      }}>
                        Repositorio
                      </span>
                    </div>
                    
                    {/* Contador */}
                    <div style={{
                      backgroundColor: isDark 
                        ? (documents.length > 0 ? "#141d47" : "#0f1735")
                        : (documents.length > 0 ? "#E8F4FD" : "#F0F0F0"),
                      color: isDark
                        ? (documents.length > 0 ? "#5b6ef0" : "#bfc7ff")
                        : (documents.length > 0 ? "#3B38A0" : "#666"),
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "500",
                      transition: "all 0.3s ease"
                    }}>
                      {loading || refreshing ? "Actualizando..." : `${documents.length} doc${documents.length !== 1 ? 's' : ''}`}
                    </div>
                    
                    {/* Botón de upload */}
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
                          showText: false,
                          variant: "fill",
                          size: "small",
                          shape: "default"
                        }}
                        modalConfig={{
                          title: "Cargar Nuevo Documento",
                          width: window.innerWidth * 0.9
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
                ) : (
                  // Vista desktop - layout horizontal
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: isDark ? "#ffffff" : "#1A2A80"
                  }}>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center",
                      minWidth: 0,
                      flex: "1 1 auto"
                    }}>
                      <FileTextOutlined style={{ 
                        marginRight: "12px", 
                        fontSize: "20px",
                        flexShrink: 0,
                        color: isDark ? "#5b6ef0" : "#1A2A80"
                      }} />
                      <span style={{ 
                        fontSize: "18px", 
                        fontWeight: "500",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        Repositorio de Documentos
                      </span>
                      <div style={{
                        marginLeft: "16px",
                        backgroundColor: isDark
                          ? (documents.length > 0 ? "#141d47" : "#0f1735")
                          : (documents.length > 0 ? "#E8F4FD" : "#F0F0F0"),
                        color: isDark
                          ? (documents.length > 0 ? "#5b6ef0" : "#bfc7ff")
                          : (documents.length > 0 ? "#3B38A0" : "#666"),
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: "500",
                        transition: "all 0.3s ease",
                        flexShrink: 0,
                        whiteSpace: "nowrap"
                      }}>
                        {loading || refreshing ? "Actualizando..." : `${documents.length} documento${documents.length !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <div style={{ 
                      flexShrink: 0
                    }}>
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
                  </div>
                )
              }
              style={{
                borderRadius: "12px",
                boxShadow: isDark ? "0 4px 16px rgba(91, 110, 240, 0.1)" : "0 4px 16px rgba(26, 42, 128, 0.1)",
                border: `1px solid ${isDark ? "#35407a" : "#e8eaed"}`,
                background: isDark ? "#0f1735" : "#ffffff"
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

      {/* Sidebar de previsualización de PDF */}
      <PdfPreviewSidebar
        document={documentToPreview}
        visible={previewSidebarVisible}
        onClose={handleCloseSidebar}
        isSmallScreen={isSmallScreen}
        sidebarWidth={sidebarWidth}
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