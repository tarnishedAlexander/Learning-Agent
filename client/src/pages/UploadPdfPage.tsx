import React, { useCallback, useState } from "react";
import { Card, message, Typography, Row, Col, Modal, Button } from "antd";
import { FileTextOutlined, ExclamationCircleOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import Uploader from "../components/Uploader";
import { DocumentTable } from "../components/documents/DocumentTable";
import { PdfPreviewSidebar } from "../components/documents/PdfPreviewSidebar";
import { useDocuments } from "../hooks/useDocuments";
import type { Document } from "../interfaces/documentInterface";

const { Title, Text } = Typography;

const UploadPdfPage: React.FC = () => {
  const { documents, loading, downloadDocument, deleteDocument, loadDocuments } = useDocuments();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ fileName: string; originalName: string } | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  
  // Estados para el sidebar de previsualización
  const [previewSidebarVisible, setPreviewSidebarVisible] = useState<boolean>(false);
  const [documentToPreview, setDocumentToPreview] = useState<Document | null>(null);
  
  // Estados para el modal de subida
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);

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

  const handleDelete = useCallback(async (fileName: string) => {
    // Buscar el documento para obtener su nombre original
    const document = documents.find(doc => doc.fileName === fileName);
    const originalName = document?.originalName || fileName;
    
    // Abrir modal de confirmación
    setDocumentToDelete({ fileName, originalName });
    setDeleteModalOpen(true);
  }, [documents]);

  const confirmDelete = useCallback(async () => {
    if (!documentToDelete) return;
    
    try {
      setDeleting(true);
      await deleteDocument(documentToDelete.fileName);
      message.success({
        content: `"${documentToDelete.originalName}" eliminado exitosamente`,
        duration: 3
      });
      setDeleteModalOpen(false);
      setDocumentToDelete(null);
      
      // Actualizar la lista de documentos
      await loadDocuments();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar";
      message.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [deleteDocument, documentToDelete, loadDocuments]);

  const cancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setDocumentToDelete(null);
  }, []);

  const handlePreview = useCallback((doc: Document) => {
    setDocumentToPreview(doc);
    setPreviewSidebarVisible(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setPreviewSidebarVisible(false);
    setDocumentToPreview(null);
  }, []);

  const handleOpenUploadModal = useCallback(() => {
    setUploadModalOpen(true);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setUploadModalOpen(false);
  }, []);

  const handleUploadSuccessAndClose = useCallback(async () => {
    await handleUploadSuccess();
    setUploadModalOpen(false);
  }, [handleUploadSuccess]);

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
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <Title 
            level={1} 
            style={{ 
              color: "#1A2A80", 
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
              color: "#7A85C1", 
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
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenUploadModal}
                    style={{
                      backgroundColor: "#1A2A80",
                      borderColor: "#1A2A80",
                      borderRadius: "8px",
                      fontWeight: "500",
                      height: "36px",
                      boxShadow: "0 2px 8px rgba(26, 42, 128, 0.2)"
                    }}
                  >
                    Subir Archivo
                  </Button>
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
                onDelete={handleDelete}
                onPreview={handlePreview}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Modal de confirmación para eliminar documento */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", color: "#d32f2f" }}>
            <ExclamationCircleOutlined style={{ marginRight: "8px", fontSize: "20px" }} />
            <span style={{ fontWeight: "600" }}>Confirmar eliminación</span>
          </div>
        }
        open={deleteModalOpen}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Eliminar Documento"
        cancelText="Cancelar"
        confirmLoading={deleting}
        centered
        width={480}
        okButtonProps={{
          danger: true,
          size: "large",
          style: {
            backgroundColor: "#d32f2f",
            borderColor: "#d32f2f",
            fontWeight: "500"
          }
        }}
        cancelButtonProps={{
          size: "large",
          style: {
            borderColor: "#7A85C1",
            color: "#3B38A0",
            fontWeight: "500"
          }
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: "48px",
            color: "#ff7875",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}>
            <DeleteOutlined style={{ fontSize: "48px" }} />
          </div>
          <p style={{ 
            marginBottom: "16px", 
            fontSize: "16px",
            color: "#262626",
            lineHeight: "1.5"
          }}>
            ¿Estás seguro de que deseas eliminar este documento?
          </p>
          {documentToDelete && (
            <div style={{
              backgroundColor: "#fff2e8",
              border: "1px solid #ffcc7a",
              borderRadius: "8px",
              padding: "16px",
              marginTop: "16px",
              textAlign: "left"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                <FileTextOutlined style={{ color: "#d46b08", marginRight: "8px", fontSize: "16px" }} />
                <Text strong style={{ color: "#d46b08", fontSize: "14px" }}>
                  {documentToDelete.originalName}
                </Text>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <ExclamationCircleOutlined style={{ color: "#faad14", marginRight: "6px", fontSize: "12px" }} />
                <Text type="secondary" style={{ fontSize: "12px", fontStyle: "italic" }}>
                  Esta acción no se puede deshacer
                </Text>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal para subir archivo */}
      <Modal
        title={
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            color: "#1A2A80",
            fontSize: "18px",
            fontWeight: "600"
          }}>
            Cargar Nuevo Documento
          </div>
        }
        open={uploadModalOpen}
        onCancel={handleCloseUploadModal}
        footer={null}
        centered
        width={600}
        destroyOnClose
        styles={{
          header: {
            backgroundColor: "#f8f9ff",
            borderBottom: "1px solid #e8eaed"
          }
        }}
      >
        <div style={{ padding: "24px 0" }}>
          <Uploader onUploadSuccess={handleUploadSuccessAndClose} />
        </div>
      </Modal>

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
