// src/hooks/useDocuments.ts
import { useState, useEffect, useCallback } from "react";
import type { Document } from "../interfaces/documentInterface";
import { documentService } from "../services/documents.service";

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.getDocuments();
      setDocuments(response.data.documents);
    } catch (err: any) {
      setError(err.message ?? "Error loading documents");
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (file: File): Promise<Document> => {
    setLoading(true);
    setError(null);
    try {
      const resp = await documentService.uploadDocument(file);
      setDocuments((prev) => [...prev, resp.data]);
      return resp.data;
    } catch (err: any) {
      setError(err.message ?? "Error uploading file");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadDocument = useCallback(async (doc: Document): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await documentService.downloadAndSaveDocument(doc.fileName, doc.originalName);
    } catch (err: any) {
      setError(err.message ?? "Error downloading file");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (fileName: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await documentService.deleteDocument(fileName);
      // refrescar lista (simple)
      await loadDocuments();
    } catch (err: any) {
      setError(err.message ?? "Error deleting file");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadDocuments]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    loading,
    error,
    loadDocuments,
    uploadDocument,
    downloadDocument,
    deleteDocument,
  };
};
