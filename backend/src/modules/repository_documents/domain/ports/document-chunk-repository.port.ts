import type { DocumentChunk } from '../entities/document-chunk.entity';

/**
 * Resultado de búsqueda de chunks
 */
export interface FindChunksResult {
  chunks: DocumentChunk[];
  total: number;
}

/**
 * Opciones para búsqueda de chunks
 */
export interface FindChunksOptions {
  /** Límite de resultados */
  limit?: number;

  /** Offset para paginación */
  offset?: number;

  /** Ordenar por campo específico */
  orderBy?: 'chunkIndex' | 'createdAt' | 'contentLength';

  /** Dirección del ordenamiento */
  orderDirection?: 'asc' | 'desc';
}

/**
 * Puerto del repositorio para operaciones con DocumentChunk
 */
export interface DocumentChunkRepositoryPort {
  /**
   * Guarda un chunk en el repositorio
   */
  save(chunk: DocumentChunk): Promise<DocumentChunk>;

  /**
   * Guarda múltiples chunks en una sola operación (más eficiente)
   */
  saveMany(chunks: DocumentChunk[]): Promise<DocumentChunk[]>;

  /**
   * Busca un chunk por su ID
   */
  findById(id: string): Promise<DocumentChunk | null>;

  /**
   * Busca todos los chunks de un documento específico
   */
  findByDocumentId(
    documentId: string,
    options?: FindChunksOptions,
  ): Promise<FindChunksResult>;

  /**
   * Busca chunks por tipo
   */
  findByType(
    type: string,
    options?: FindChunksOptions,
  ): Promise<FindChunksResult>;

  /**
   * Elimina todos los chunks de un documento
   * (útil para re-procesamiento)
   */
  deleteByDocumentId(documentId: string): Promise<void>;

  /**
   * Elimina un chunk específico
   */
  deleteById(id: string): Promise<void>;

  /**
   * Cuenta el número total de chunks de un documento
   */
  countByDocumentId(documentId: string): Promise<number>;

  /**
   * Verifica si existen chunks para un documento
   */
  existsByDocumentId(documentId: string): Promise<boolean>;

  /**
   * Obtiene estadísticas de chunks para un documento
   */
  getDocumentChunkStatistics(documentId: string): Promise<{
    totalChunks: number;
    averageChunkSize: number;
    minChunkSize: number;
    maxChunkSize: number;
    totalContentLength: number;
  }>;
}
