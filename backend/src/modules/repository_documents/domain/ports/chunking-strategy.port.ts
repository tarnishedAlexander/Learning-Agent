import type { DocumentChunk } from '../entities/document-chunk.entity';

/**
 * Configuración para la estrategia de chunking
 */
export interface ChunkingConfig {
  /** Tamaño máximo de cada chunk en caracteres */
  maxChunkSize: number;

  /** Solapamiento entre chunks para preservar contexto */
  overlap: number;

  /** Priorizar división por párrafos */
  respectParagraphs: boolean;

  /** Priorizar división por oraciones */
  respectSentences: boolean;

  /** Tamaño mínimo de un chunk para ser válido */
  minChunkSize: number;
}

/**
 * Resultado del proceso de chunking
 */
export interface ChunkingResult {
  /** Lista de chunks generados */
  chunks: DocumentChunk[];

  /** Número total de chunks creados */
  totalChunks: number;

  /** Estadísticas del proceso */
  statistics: {
    /** Tamaño promedio de chunks */
    averageChunkSize: number;

    /** Tamaño del chunk más pequeño */
    minChunkSize: number;

    /** Tamaño del chunk más grande */
    maxChunkSize: number;

    /** Porcentaje de solapamiento real */
    actualOverlapPercentage: number;
  };
}

/**
 * Puerto para diferentes estrategias de chunking de texto
 */
export interface ChunkingStrategyPort {
  /**
   * Divide un texto en chunks según la estrategia implementada
   *
   * @param documentId - ID del documento al que pertenecen los chunks
   * @param text - Texto a dividir en chunks
   * @param config - Configuración de chunking
   * @returns Resultado del chunking con estadísticas
   */
  chunkText(
    documentId: string,
    text: string,
    config: ChunkingConfig,
  ): Promise<ChunkingResult>;

  /**
   * Valida que la configuración de chunking sea válida
   *
   * @param config - Configuración a validar
   * @returns true si es válida, false en caso contrario
   */
  validateConfig(config: ChunkingConfig): boolean;

  /**
   * Obtiene la configuración por defecto para esta estrategia
   */
  getDefaultConfig(): ChunkingConfig;
}
