/**
 * Chunk con información de similitud
 */
export interface SearchResultChunk {
  id: string;
  documentId: string;
  content: string;
  type: string;
  chunkIndex: number;
  wordCount: number;
  charCount: number;
  startPosition: number;
  endPosition: number;
  similarityScore: number;
  documentTitle?: string;
  documentFileName?: string;
  documentFileSize?: number;
  documentContentType?: string;
  metadata?: any;
  createdAt: Date;
}

/**
 * Resultado de búsqueda vectorial
 */
export interface VectorSearchResult {
  /** Chunks encontrados ordenados por relevancia */
  chunks: SearchResultChunk[];

  /** Número total de resultados */
  totalResults: number;

  /** Opciones aplicadas en la búsqueda */
  searchOptions: VectorSearchOptions;

  /** Tiempo de procesamiento en ms */
  processingTimeMs: number;
}

/**
 * Resultado completo de búsqueda semántica
 */
export interface SemanticSearchResult {
  /** Query utilizada para la búsqueda */
  query: string;

  /** Embedding generado para la query */
  queryEmbedding: any; // EmbeddingResult - evitamos import circular

  /** Resultado de la búsqueda vectorial */
  searchResult: VectorSearchResult;

  /** Número total de resultados */
  totalResults: number;

  /** Tiempo de procesamiento total */
  processingTimeMs: number;
}

/**
 * Documento similar encontrado
 */
export interface SimilarDocument {
  /** ID del documento */
  documentId: string;

  /** Título del documento */
  title?: string;

  /** Nombre del archivo */
  fileName?: string;

  /** Similitud promedio */
  averageSimilarity: number;

  /** Similitud máxima */
  maxSimilarity: number;

  /** Chunks más relevantes */
  relevantChunks: SearchResultChunk[];

  /** Número total de chunks del documento */
  totalChunks: number;
}

/**
 * Opciones para búsqueda vectorial
 */
export interface VectorSearchOptions {
  /** Número máximo de resultados a devolver */
  limit?: number;

  /** Umbral mínimo de similitud (0-1) */
  similarityThreshold?: number;

  /** Si incluir metadatos */
  includeMetadata?: boolean;

  /** Si incluir contenido completo */
  includeContent?: boolean;

  /** IDs de documentos específicos para filtrar */
  documentIds?: string[];

  /** Tipos de chunks a incluir */
  chunkTypes?: string[];

  /** IDs de chunks a excluir */
  excludeChunkIds?: string[];

  /** IDs de documentos a excluir */
  excludeDocumentIds?: string[];

  /** Si agrupar por documento */
  groupByDocument?: boolean;

  /** Filtros adicionales */
  additionalFilters?: Record<string, any>;
}

/**
 * Puerto para búsqueda vectorial y semántica
 *
 * Define la interfaz para realizar búsquedas por similaridad
 * usando embeddings vectoriales
 */
export interface VectorSearchPort {
  /**
   * Busca chunks similares usando un vector de embeddings
   */
  searchByVector(
    queryVector: number[],
    options?: VectorSearchOptions,
  ): Promise<VectorSearchResult>;

  /**
   * Busca chunks similares convirtiendo texto a vector primero
   */
  searchByText(
    query: string,
    options?: VectorSearchOptions,
  ): Promise<SemanticSearchResult>;

  /**
   * Encuentra chunks similares a uno específico
   */
  findSimilarChunks(
    chunkId: string,
    options?: VectorSearchOptions,
  ): Promise<VectorSearchResult>;

  /**
   * Encuentra documentos similares a uno específico
   */
  findSimilarDocuments(
    documentId: string,
    options?: VectorSearchOptions,
  ): Promise<SimilarDocument[]>;
}
