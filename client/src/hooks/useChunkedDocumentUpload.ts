import { useCallback } from 'react';
import { chunkedUploadService } from '../services/chunkedUpload.service';
import { documentService } from '../services/documents.service';
import type { 
  ChunkedUploadResult, 
  ChunkedUploadOptions 
} from '../services/chunkedUpload.service';
import type { Document } from '../interfaces/documentInterface';

/**
 * Hook personalizado para manejo de upload chunked integrado con el procesamiento de documentos
 */
export const useChunkedDocumentUpload = () => {
  
  /**
   * Función de procesamiento post-upload compatible con el componente ChunkedUploadButton
   */
  const processDocumentComplete = useCallback(async (
    document: ChunkedUploadResult['document'],
    onProgress?: (step: string, progress: number, message: string) => void
  ): Promise<{
    success: boolean;
    document: Document;
    processing: {
      textProcessed: boolean;
      chunksProcessed: boolean;
      totalChunks: number;
    };
  }> => {
    if (!document) {
      throw new Error('Documento no disponible para procesamiento');
    }

    try {
      // Convertir el documento del resultado chunked al formato esperado
      const documentForProcessing: Document = {
        id: document.id,
        fileName: document.fileName,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        downloadUrl: document.downloadUrl,
        uploadedAt: document.uploadedAt,
      };

      // Paso 1: Procesar texto
      onProgress?.('text', 33, 'Procesando texto del documento...');
      await documentService.processDocumentText(document.id);

      // Paso 2: Procesar chunks
      onProgress?.('chunks', 66, 'Generando chunks del documento...');
      const chunksResult = await documentService.processDocumentChunks(document.id);

      // Paso 3: Completado
      onProgress?.('complete', 100, 'Procesamiento completado');

      return {
        success: true,
        document: documentForProcessing,
        processing: {
          textProcessed: true,
          chunksProcessed: true,
          totalChunks: chunksResult.data?.totalChunks || 0,
        },
      };
    } catch (error) {
      console.error('Error in post-upload processing:', error);
      throw new Error('Error en el procesamiento post-upload del documento');
    }
  }, []);

  /**
   * Función de upload completo con chunks y procesamiento
   */
  const uploadAndProcessDocument = useCallback(async (
    file: File,
    options: ChunkedUploadOptions = {}
  ): Promise<{
    success: boolean;
    document: Document;
    processing: {
      textProcessed: boolean;
      chunksProcessed: boolean;
      totalChunks: number;
    };
  }> => {
    try {
      // Realizar upload chunked
      const uploadResult = await chunkedUploadService.uploadFileWithChunks(file, options);
      
      if (!uploadResult.success || !uploadResult.document) {
        throw new Error(uploadResult.error || 'Error en la subida chunked');
      }

      // Procesar el documento
      const processingResult = await processDocumentComplete(uploadResult.document);
      
      return processingResult;
    } catch (error) {
      console.error('Error in complete chunked upload and processing:', error);
      throw error;
    }
  }, [processDocumentComplete]);

  /**
   * Función para cancelar upload
   */
  const cancelUpload = useCallback(async (sessionId: string): Promise<void> => {
    try {
      await chunkedUploadService.cancelUpload(sessionId);
    } catch (error) {
      console.error('Error canceling upload:', error);
      throw error;
    }
  }, []);

  /**
   * Función para obtener estadísticas de upload
   */
  const getUploadStats = useCallback((sessionId: string) => {
    return chunkedUploadService.getUploadStats(sessionId);
  }, []);

  /**
   * Función para verificar si un upload está en progreso
   */
  const isUploadInProgress = useCallback((sessionId: string): boolean => {
    return chunkedUploadService.isUploadInProgress(sessionId);
  }, []);

  /**
   * Función para limpiar sesiones completadas
   */
  const cleanupCompletedSessions = useCallback((): void => {
    chunkedUploadService.cleanupCompletedSessions();
  }, []);

  return {
    // Función principal para usar con ChunkedUploadButton
    processDocumentComplete,
    
    // Función completa de upload y procesamiento
    uploadAndProcessDocument,
    
    // Funciones de control
    cancelUpload,
    getUploadStats,
    isUploadInProgress,
    cleanupCompletedSessions,
    
    // Servicio subyacente para acceso directo si es necesario
    chunkedUploadService,
  };
};
