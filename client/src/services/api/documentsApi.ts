// API service para documentos - Backend hexagonal
import { apiClient } from "../../api/apiClient";
import type { Document } from "../../interfaces/documentInterface";

export interface DocumentListResponseBackend {
  success: boolean;
  message: string;
  documents: Array<{
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    downloadUrl: string;
    uploadedAt: string;
  }>;
  total: number;
}

export interface UploadResponseBackend {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  uploadedAt: string;
}

export interface DeleteResponseBackend {
  success: boolean;
  message: string;
  fileName: string;
  deletedAt: string;
}

export interface ProcessChunksResponse {
  success: boolean;
  message: string;
  data?: {
    totalChunks: number;
    processingTimeMs: number;
    statistics: {
      averageChunkSize: number;
      minChunkSize: number;
      maxChunkSize: number;
      actualOverlapPercentage: number;
    };
  };
}

export interface DocumentChunksResponse {
  success: boolean;
  message: string;
  data: {
    chunks: Array<{
      id: string;
      content: string;
      chunkIndex: number;
      type: string;
      contentLength: number;
      metadata?: Record<string, unknown>;
      createdAt: string;
    }>;
    total: number;
    statistics: {
      totalChunks: number;
      averageChunkSize: number;
      minChunkSize: number;
      maxChunkSize: number;
      totalContentLength: number;
    };
  };
}

export const documentsApi = {
  /**
   * Subir un documento al backend
   */
  async uploadDocument(file: File): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<UploadResponseBackend>(
        '/api/documents/upload', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Mapear respuesta del backend a nuestra interfaz Document
      return {
        fileName: response.data.fileName,
        originalName: response.data.originalName,
        mimeType: response.data.mimeType,
        size: response.data.size,
        downloadUrl: response.data.downloadUrl,
        uploadedAt: response.data.uploadedAt,
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Error al subir el documento');
    }
  },

  /**
   * Listar todos los documentos
   */
  async getDocuments(): Promise<{ documents: Document[]; total: number }> {
    try {
      const response = await apiClient.get<DocumentListResponseBackend>('/api/documents');
      
      // Mapear respuesta del backend
      const documents: Document[] = response.data.documents.map(doc => ({
        fileName: doc.fileName,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        size: doc.size,
        downloadUrl: doc.downloadUrl,
        uploadedAt: doc.uploadedAt,
      }));

      return {
        documents,
        total: response.data.total,
      };
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Error al obtener los documentos');
    }
  },

  /**
   * Descargar un documento usando URL firmada
   */
  async downloadDocument(fileName: string): Promise<Blob> {
    try {
      // Obtener URL firmada del backend
      const signedUrl = await this.getDownloadUrl(fileName);
      
      // Descargar usando la URL firmada
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error downloading document:', error);
      throw new Error('Error al descargar el documento');
    }
  },

  /**
   * Generar URL de descarga para un documento
   */
  async getDownloadUrl(fileName: string): Promise<string> {
    try {
      const response = await apiClient.get<{ downloadUrl: string }>(
        `/api/documents/download/${encodeURIComponent(fileName)}`
      );

      return response.data.downloadUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw new Error('Error al generar URL de descarga');
    }
  },

  /**
   * Eliminar un documento
   */
  async deleteDocument(fileName: string): Promise<void> {
    try {
      await apiClient.delete<DeleteResponseBackend>(
        `/api/documents/${encodeURIComponent(fileName)}`
      );
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Error al eliminar el documento');
    }
  },

  /**
   * Descargar y guardar archivo automáticamente usando URL firmada
   */
  async downloadAndSaveDocument(fileName: string, originalName?: string): Promise<void> {
    try {
      // Obtener URL firmada del backend
      const response = await apiClient.get<{ downloadUrl: string }>(
        `/api/documents/download/${encodeURIComponent(fileName)}`
      );
      
      const signedUrl = response.data.downloadUrl;
      
      // Descargar el archivo usando fetch para obtener el blob
      const fileResponse = await fetch(signedUrl);
      if (!fileResponse.ok) {
        throw new Error(`Error al descargar: ${fileResponse.status}`);
      }
      
      const blob = await fileResponse.blob();
      
      // Crear URL temporal para descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName || fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading and saving document:', error);
      throw new Error('Error al descargar y guardar el documento');
    }
  },

  /**
   * Procesar texto de un documento (funcionalidad adicional de tu backend)
   */
  async processDocumentText(documentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `/api/documents/${documentId}/process-text`
      );

      return response.data;
    } catch (error) {
      console.error('Error processing document text:', error);
      throw new Error('Error al procesar el texto del documento');
    }
  },

  /**
   * Procesar chunks de un documento (funcionalidad adicional de tu backend)
   */
  async processDocumentChunks(
    documentId: string, 
    options?: {
      chunkingConfig?: {
        maxChunkSize?: number;
        overlap?: number;
        respectParagraphs?: boolean;
        respectSentences?: boolean;
        minChunkSize?: number;
      };
      replaceExisting?: boolean;
      chunkType?: string;
    }
  ): Promise<ProcessChunksResponse> {
    try {
      const response = await apiClient.post(
        `/api/documents/${documentId}/process-chunks`,
        options || {}
      );

      return response.data;
    } catch (error) {
      console.error('Error processing document chunks:', error);
      throw new Error('Error al procesar los chunks del documento');
    }
  },

  /**
   * Obtener chunks de un documento
   */
  async getDocumentChunks(documentId: string): Promise<DocumentChunksResponse> {
    try {
      const response = await apiClient.get(`/api/documents/${documentId}/chunks`);
      return response.data;
    } catch (error) {
      console.error('Error getting document chunks:', error);
      throw new Error('Error al obtener los chunks del documento');
    }
  },
};
