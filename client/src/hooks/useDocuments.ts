import { useState, useEffect, useCallback } from 'react';
import type { Document } from '../interfaces/documentInterface';
import { documentsApi } from '../services/api/documentsApi';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentsApi.getDocuments();
      setDocuments(response.documents);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error loading documents';
      setError(errorMessage);
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (file: File): Promise<Document> => {
    setLoading(true);
    setError(null);
    try {
      const newDocument = await documentsApi.uploadDocument(file);
      setDocuments((prevDocs) => [...prevDocs, newDocument]);
      return newDocument;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error uploading file';
      setError(errorMessage);
      console.error('Error uploading file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const downloadDocument = useCallback(async (document: Document): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await documentsApi.downloadAndSaveDocument(document.fileName, document.originalName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error downloading file';
      setError(errorMessage);
      console.error('Error downloading file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (fileName: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await documentsApi.deleteDocument(fileName);
      setDocuments((prevDocs) => 
        prevDocs.filter(doc => doc.fileName !== fileName)
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error deleting file';
      setError(errorMessage);
      console.error('Error deleting file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Funcionalidades adicionales del backend hexagonal
  const processDocumentText = useCallback(async (documentId: string): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await documentsApi.processDocumentText(documentId);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error processing document text';
      setError(errorMessage);
      console.error('Error processing document text:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const processDocumentChunks = useCallback(async (
    documentId: string, 
    options?: Parameters<typeof documentsApi.processDocumentChunks>[1]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await documentsApi.processDocumentChunks(documentId, options);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error processing document chunks';
      setError(errorMessage);
      console.error('Error processing document chunks:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumentChunks = useCallback(async (documentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await documentsApi.getDocumentChunks(documentId);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error getting document chunks';
      setError(errorMessage);
      console.error('Error getting document chunks:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const processDocumentComplete = useCallback(async (
    file: File,
    onProgress?: (step: string, progress: number, message: string) => void
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await documentsApi.processDocumentComplete(file, onProgress);
      // Actualizar la lista de documentos después del procesamiento completo
      setDocuments((prevDocs) => [...prevDocs, result.document]);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error in complete document processing';
      setError(errorMessage);
      console.error('Error in complete document processing:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    // Estados básicos
    documents,
    loading,
    error,
    
    // Operaciones CRUD básicas
    uploadDocument,
    downloadDocument,
    deleteDocument,
    loadDocuments,
    
    // Funcionalidades avanzadas del backend hexagonal
    processDocumentText,
    processDocumentChunks,
    getDocumentChunks,
    processDocumentComplete,
  };
};