import { useState, useEffect, useCallback } from 'react';
import type { 
  Document, 
  DocumentMetadata, 
  DocumentStatistics, 
  DocumentChunk, 
  DocumentExtractedData 
} from '../interfaces/documentInterface';
import { documentService } from '../services/documents.service';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para datos extraídos
  const [extractedDataCache, setExtractedDataCache] = useState<Record<string, DocumentExtractedData>>({});
  const [extractedDataLoading, setExtractedDataLoading] = useState<Record<string, boolean>>({});
  const [extractedDataError, setExtractedDataError] = useState<Record<string, string | null>>({});

  const loadDocuments = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await documentService.getDocuments();
      setDocuments(response.data.documents);
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
      const response = await documentService.uploadDocument(file);
      const newDocument = response.data;
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
      await documentService.downloadAndSaveDocument(document.id, document.originalName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error downloading file';
      setError(errorMessage);
      console.error('Error downloading file:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await documentService.deleteDocument(documentId);
      setDocuments((prevDocs) => 
        prevDocs.filter(doc => doc.id !== documentId)
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
      const result = await documentService.processDocumentText(documentId);
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
    options?: {
      chunkSize?: number;
      overlapSize?: number;
      maxChunkSize?: number;
      strategy?: string;
      minChunkSize?: number;
      preserveFormatting?: boolean;
      splitBy?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await documentService.processDocumentChunks(documentId, options);
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
      const result = await documentService.getDocumentChunks(documentId);
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
      const result = await documentService.processDocumentComplete(file, onProgress);
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

  // Nuevas funciones para manejo de datos extraídos
  const getDocumentExtractedData = useCallback(async (documentId: string): Promise<DocumentExtractedData> => {
    // Si ya está en caché, devolverlo
    if (extractedDataCache[documentId]) {
      return extractedDataCache[documentId];
    }

    // Marcar como cargando
    setExtractedDataLoading(prev => ({ ...prev, [documentId]: true }));
    setExtractedDataError(prev => ({ ...prev, [documentId]: null }));

    try {
      // Obtener chunks del documento
      const chunksResponse = await documentService.getDocumentChunks(documentId);
      
      // Buscar el documento en la lista para obtener metadatos básicos
      const document = documents.find(doc => doc.id === documentId);
      
      // Preparar metadatos
      const metadata: DocumentMetadata = {
        fileName: document?.fileName || '',
        fileType: document?.mimeType?.split('/')[1]?.toUpperCase() || 'Unknown',
        uploadDate: document?.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : '',
        mimeType: document?.mimeType || '',
        size: document?.size || 0,
        title: document?.originalName?.replace(/\.[^/.]+$/, "") || '', // Nombre sin extensión
        // Los siguientes podrían venir del backend en el futuro
        author: 'No disponible',
        pages: 0,
        language: 'No disponible'
      };

      // Preparar estadísticas
      const statistics: DocumentStatistics = {
        wordCount: 0, // Se calculará del texto completo si está disponible
        charCount: 0, // Se calculará del texto completo si está disponible  
        chunkCount: chunksResponse.data.statistics.totalChunks,
        averageChunkSize: chunksResponse.data.statistics.averageChunkSize,
        minChunkSize: chunksResponse.data.statistics.minChunkSize,
        maxChunkSize: chunksResponse.data.statistics.maxChunkSize,
        totalContentLength: chunksResponse.data.statistics.totalContentLength
      };

      // Preparar chunks
      const chunks: DocumentChunk[] = chunksResponse.data.chunks;

      // Crear objeto de datos extraídos
      const extractedData: DocumentExtractedData = {
        metadata,
        statistics,
        chunks
      };

      // Guardar en caché
      setExtractedDataCache(prev => ({ ...prev, [documentId]: extractedData }));

      return extractedData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener datos extraídos';
      setExtractedDataError(prev => ({ ...prev, [documentId]: errorMessage }));
      throw error;
    } finally {
      setExtractedDataLoading(prev => ({ ...prev, [documentId]: false }));
    }
  }, [documents, extractedDataCache]);

  const generateDocumentEmbeddings = useCallback(async (documentId: string): Promise<void> => {
    setExtractedDataLoading(prev => ({ ...prev, [documentId]: true }));
    setExtractedDataError(prev => ({ ...prev, [documentId]: null }));

    try {
      await documentService.generateDocumentEmbeddings(documentId);
      
      // Limpiar caché para forzar recarga de datos
      setExtractedDataCache(prev => {
        const newCache = { ...prev };
        delete newCache[documentId];
        return newCache;
      });
      
      // Recargar datos
      await getDocumentExtractedData(documentId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al generar embeddings';
      setExtractedDataError(prev => ({ ...prev, [documentId]: errorMessage }));
      throw error;
    } finally {
      setExtractedDataLoading(prev => ({ ...prev, [documentId]: false }));
    }
  }, [getDocumentExtractedData]);

  const clearExtractedDataCache = useCallback((documentId?: string) => {
    if (documentId) {
      setExtractedDataCache(prev => {
        const newCache = { ...prev };
        delete newCache[documentId];
        return newCache;
      });
      setExtractedDataError(prev => {
        const newErrors = { ...prev };
        delete newErrors[documentId];
        return newErrors;
      });
    } else {
      setExtractedDataCache({});
      setExtractedDataError({});
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

    // Nuevas funcionalidades para datos extraídos
    getDocumentExtractedData,
    generateDocumentEmbeddings,
    clearExtractedDataCache,
    
    // Estados para datos extraídos
    extractedDataCache,
    extractedDataLoading,
    extractedDataError,
  };
};