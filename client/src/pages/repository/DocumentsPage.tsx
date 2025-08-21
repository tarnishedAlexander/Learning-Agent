import { useCallback } from "react";
import { Space, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { DocumentTable } from "../../components/documents/DocumentTable";
import { useDocuments } from "../../hooks/useDocuments";
import type { Document } from "../../interfaces/documentInterface";

export function DocumentsPage() {
  const { documents, loading, uploadDocument, downloadDocument, deleteDocument } = useDocuments();

  const handleBeforeUpload = useCallback(async (file: File) => {
    try {
      await uploadDocument(file);
      message.success("Archivo subido correctamente");
    } catch (err: any) {
      message.error(err?.message ?? "Error al subir archivo");
    }
    return false;
  }, [uploadDocument]);

  const handleDownload = useCallback(async (doc: Document) => {
    try {
      await downloadDocument(doc);
    } catch (err: any) {
      message.error(err?.message ?? "Error al descargar");
    }
  }, [downloadDocument]);

  const handleDelete = useCallback(async (fileName: string) => {
    try {
      await deleteDocument(fileName);
      message.success("Documento eliminado");
    } catch (err: any) {
      message.error(err?.message ?? "Error al eliminar");
    }
  }, [deleteDocument]);

  return (
    <div style={{ padding: "24px" }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <h1 style={{ color: "#1A2A80" }}>Documentos del Curso</h1>

        <div style={{ display: "flex", gap: 12 }}>
          <Upload showUploadList={false} beforeUpload={(file) => handleBeforeUpload(file as File)}>
            <Button icon={<UploadOutlined />}>Subir archivo</Button>
          </Upload>
        </div>

        <DocumentTable
          documents={documents}
          loading={loading}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      </Space>
    </div>
  );
}
