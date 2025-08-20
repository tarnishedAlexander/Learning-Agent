import { useState, useEffect, useCallback } from 'react';
import type { Document } from '../interfaces/documentInterface';
import { documentService } from '../services/documentService';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async (): Promise<void> => { // Prevents unnecessary re-renders
    setLoading(true);
    setError(null);
    try {
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (error) {
      setError('Error loading documents');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (document: File): Promise<Document> => {
    setLoading(true);
    setError(null);
    try {
      const newFile = await documentService.uploadDocument(document);
      setDocuments((prevDocs) => [...prevDocs, newFile]);
      return newFile;
    } catch (error) {
      setError('Error uploading file');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const downloadFile = useCallback(async (doc: Document): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await documentService.downloadPdf(doc.id);
    } catch (error) {
      setError('Error downloading file');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    uploadDocument,
    downloadFile,
    loadDocuments,
    loading,
    error,
  };
};