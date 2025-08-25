import { Injectable } from '@nestjs/common';
import { DocumentEmbeddingService } from '../../domain/services/document-embedding.service';
import type {
  VectorSearchOptions,
  SemanticSearchResult,
} from '../../domain/ports/vector-search.port';

/**
 * DTO para solicitud de búsqueda semántica
 */
export interface SearchDocumentsRequest {
  /** Texto de búsqueda */
  query: string;

  /** Opciones de búsqueda */
  searchOptions?: {
    /** Número máximo de resultados */
    limit?: number;

    /** Umbral de similitud mínimo */
    similarityThreshold?: number;

    /** Filtrar por documentos específicos */
    documentIds?: string[];

    /** Filtrar por tipos de chunks */
    chunkTypes?: string[];

    /** Configuración adicional */
    additionalFilters?: Record<string, any>;
  };

  /** Si debe incluir metadatos extendidos */
  includeMetadata?: boolean;

  /** Si debe incluir contenido completo de chunks */
  includeContent?: boolean;
}

/**
 * Resultado de la búsqueda semántica
 */
export interface SearchDocumentsResponse {
  /** Indica si la búsqueda fue exitosa */
  success: boolean;

  /** Resultado de la búsqueda */
  result?: SemanticSearchResult;

  /** Mensaje de error si falló */
  error?: string;

  /** Código de error */
  errorCode?: string;

  /** Información adicional sobre la búsqueda */
  searchInfo?: {
    /** Tiempo de procesamiento en ms */
    processingTimeMs: number;

    /** Términos de búsqueda procesados */
    processedQuery: string;

    /** Configuración aplicada */
    appliedOptions: VectorSearchOptions;
  };
}

/**
 * Caso de uso para búsqueda semántica de documentos
 *
 * Permite realizar búsquedas por similaridad semántica en la base
 * de conocimientos de documentos usando embeddings vectoriales
 */
@Injectable()
export class SearchDocumentsUseCase {
  constructor(
    private readonly documentEmbeddingService: DocumentEmbeddingService,
  ) {}

  /**
   * Ejecuta una búsqueda semántica en los documentos
   *
   * @param request - Solicitud con parámetros de búsqueda
   */
  async execute(
    request: SearchDocumentsRequest,
  ): Promise<SearchDocumentsResponse> {
    const startTime = Date.now();

    try {
      // 1. Validar entrada
      this.validateRequest(request);

      // 2. Preparar opciones de búsqueda
      const searchOptions = this.prepareSearchOptions(request);

      // 3. Ejecutar búsqueda
      const result = await this.documentEmbeddingService.searchDocuments(
        request.query,
        searchOptions,
      );

      const processingTimeMs = Date.now() - startTime;

      return {
        success: true,
        result,
        searchInfo: {
          processingTimeMs,
          processedQuery: request.query.trim(),
          appliedOptions: searchOptions,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error en SearchDocumentsUseCase:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        errorCode: this.categorizeError(error),
        searchInfo: {
          processingTimeMs: Date.now() - startTime,
          processedQuery: request.query.trim(),
          appliedOptions: this.prepareSearchOptions(request),
        },
      };
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Valida la solicitud de búsqueda
   */
  private validateRequest(request: SearchDocumentsRequest): void {
    // Validar query
    if (!request.query || typeof request.query !== 'string') {
      throw new Error(
        'La consulta de búsqueda es requerida y debe ser una cadena válida',
      );
    }

    const trimmedQuery = request.query.trim();
    if (trimmedQuery.length === 0) {
      throw new Error('La consulta de búsqueda no puede estar vacía');
    }

    if (trimmedQuery.length < 3) {
      throw new Error(
        'La consulta de búsqueda debe tener al menos 3 caracteres',
      );
    }

    if (trimmedQuery.length > 8000) {
      throw new Error(
        'La consulta de búsqueda es demasiado larga (máximo 8000 caracteres)',
      );
    }

    // Validar opciones de búsqueda
    if (request.searchOptions) {
      const { limit, similarityThreshold, documentIds } = request.searchOptions;

      if (limit !== undefined) {
        if (!Number.isInteger(limit) || limit < 1) {
          throw new Error('El límite debe ser un número entero positivo');
        }

        if (limit > 1000) {
          throw new Error('El límite no puede ser mayor a 1000 resultados');
        }
      }

      if (similarityThreshold !== undefined) {
        if (
          typeof similarityThreshold !== 'number' ||
          similarityThreshold < 0 ||
          similarityThreshold > 1
        ) {
          throw new Error(
            'El umbral de similitud debe ser un número entre 0 y 1',
          );
        }
      }

      if (documentIds && Array.isArray(documentIds)) {
        if (documentIds.length === 0) {
          throw new Error(
            'Si se especifican IDs de documentos, debe haber al menos uno',
          );
        }

        const invalidIds = documentIds.filter(
          (id) => !id || typeof id !== 'string',
        );
        if (invalidIds.length > 0) {
          throw new Error(
            'Todos los IDs de documentos deben ser cadenas válidas no vacías',
          );
        }
      }
    }
  }

  /**
   * Prepara las opciones de búsqueda vectorial
   */
  private prepareSearchOptions(
    request: SearchDocumentsRequest,
  ): VectorSearchOptions {
    const defaultOptions: VectorSearchOptions = {
      limit: 10,
      similarityThreshold: 0.7,
      includeMetadata: true,
      includeContent: true,
    };

    if (!request.searchOptions) {
      return defaultOptions;
    }

    return {
      limit: request.searchOptions.limit ?? defaultOptions.limit,
      similarityThreshold:
        request.searchOptions.similarityThreshold ??
        defaultOptions.similarityThreshold,
      includeMetadata:
        request.includeMetadata ?? defaultOptions.includeMetadata,
      includeContent: request.includeContent ?? defaultOptions.includeContent,
      documentIds: request.searchOptions.documentIds,
      chunkTypes: request.searchOptions.chunkTypes,
      additionalFilters: request.searchOptions.additionalFilters,
    };
  }

  /**
   * Categoriza el tipo de error para mejor manejo
   */
  private categorizeError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'UNKNOWN_ERROR';
    }

    const message = error.message.toLowerCase();

    if (message.includes('consulta') || message.includes('query')) {
      return 'INVALID_QUERY';
    }

    if (message.includes('embedding') || message.includes('vector')) {
      return 'EMBEDDING_ERROR';
    }

    if (message.includes('búsqueda') || message.includes('search')) {
      return 'SEARCH_ERROR';
    }

    if (message.includes('api') || message.includes('openai')) {
      return 'API_ERROR';
    }

    if (message.includes('base de datos') || message.includes('database')) {
      return 'DATABASE_ERROR';
    }

    if (
      message.includes('red') ||
      message.includes('network') ||
      message.includes('timeout')
    ) {
      return 'NETWORK_ERROR';
    }

    if (message.includes('validar') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }

    return 'PROCESSING_ERROR';
  }
}
