import { Injectable } from '@nestjs/common';
import { DocumentEmbeddingService } from '../../domain/services/document-embedding.service';
import type {
  DocumentEmbeddingOptions,
  DocumentEmbeddingResult,
} from '../../domain/services/document-embedding.service';

/**
 * DTO para solicitud de generación de embeddings
 */
export interface GenerateDocumentEmbeddingsRequest {
  /** ID del documento */
  documentId: string;

  /** Configuración de embeddings */
  embeddingConfig?: {
    /** Modelo a utilizar */
    model?: string;

    /** Dimensiones del embedding */
    dimensions?: number;

    /** Configuración adicional */
    additionalConfig?: Record<string, any>;
  };

  /** Si debe reemplazar embeddings existentes */
  replaceExisting?: boolean;

  /** Tamaño de lote para procesamiento */
  batchSize?: number;

  /** Filtros para chunks específicos */
  chunkFilters?: {
    chunkTypes?: string[];
    chunkIndices?: number[];
    minContentLength?: number;
  };
}

/**
 * Resultado de la generación de embeddings
 */
export interface GenerateDocumentEmbeddingsResponse {
  /** Indica si la operación fue exitosa */
  success: boolean;

  /** Resultado detallado */
  result?: DocumentEmbeddingResult;

  /** Mensaje de error si falló */
  error?: string;

  /** Código de error */
  errorCode?: string;
}

/**
 * Caso de uso para generar embeddings de un documento
 *
 * Coordina el proceso completo de generación de embeddings vectoriales
 * para todos los chunks de un documento específico
 */
@Injectable()
export class GenerateDocumentEmbeddingsUseCase {
  constructor(
    private readonly documentEmbeddingService: DocumentEmbeddingService,
  ) {}

  /**
   * Ejecuta la generación de embeddings para un documento
   *
   * @param request - Solicitud con parámetros de generación
   */
  async execute(
    request: GenerateDocumentEmbeddingsRequest,
  ): Promise<GenerateDocumentEmbeddingsResponse> {
    try {
      // 1. Validar entrada
      this.validateRequest(request);

      // 2. Preparar opciones
      const options: DocumentEmbeddingOptions = {
        embeddingConfig: request.embeddingConfig
          ? {
              model: request.embeddingConfig.model,
              dimensions: request.embeddingConfig.dimensions,
              additionalConfig: request.embeddingConfig.additionalConfig,
            }
          : undefined,
        replaceExisting: request.replaceExisting ?? false,
        batchSize: request.batchSize ?? 20,
        chunkFilters: request.chunkFilters,
      };

      // 3. Generar embeddings
      const result =
        await this.documentEmbeddingService.generateDocumentEmbeddings(
          request.documentId,
          options,
        );

      // 4. Verificar si hubo errores parciales
      if (result.chunksWithErrors > 0) {
        console.warn(
          `⚠️ Algunos chunks tuvieron errores: ${result.chunksWithErrors}/${result.totalChunksProcessed + result.chunksWithErrors}`,
        );
      }

      return {
        success: true,
        result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(
        '❌ Error en GenerateDocumentEmbeddingsUseCase:',
        errorMessage,
      );

      return {
        success: false,
        error: errorMessage,
        errorCode: this.categorizeError(error),
      };
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Valida la solicitud de generación de embeddings
   */
  private validateRequest(request: GenerateDocumentEmbeddingsRequest): void {
    // Validar documentId
    if (!request.documentId || typeof request.documentId !== 'string') {
      throw new Error(
        'El ID del documento es requerido y debe ser una cadena válida',
      );
    }

    if (request.documentId.trim().length === 0) {
      throw new Error('El ID del documento no puede estar vacío');
    }

    // Validar batchSize
    if (request.batchSize !== undefined) {
      if (!Number.isInteger(request.batchSize) || request.batchSize < 1) {
        throw new Error('El tamaño de lote debe ser un número entero positivo');
      }

      if (request.batchSize > 2048) {
        throw new Error(
          'El tamaño de lote no puede ser mayor a 2048 (límite de OpenAI)',
        );
      }
    }

    // Validar filtros de chunks
    if (request.chunkFilters) {
      if (request.chunkFilters.chunkIndices) {
        const invalidIndices = request.chunkFilters.chunkIndices.filter(
          (index) => !Number.isInteger(index) || index < 0,
        );

        if (invalidIndices.length > 0) {
          throw new Error(
            'Los índices de chunks deben ser números enteros no negativos',
          );
        }
      }

      if (request.chunkFilters.minContentLength !== undefined) {
        if (
          !Number.isInteger(request.chunkFilters.minContentLength) ||
          request.chunkFilters.minContentLength < 0
        ) {
          throw new Error(
            'La longitud mínima de contenido debe ser un número entero no negativo',
          );
        }
      }
    }

    // Validar configuración de embeddings
    if (request.embeddingConfig?.dimensions !== undefined) {
      if (
        !Number.isInteger(request.embeddingConfig.dimensions) ||
        request.embeddingConfig.dimensions < 1
      ) {
        throw new Error(
          'Las dimensiones del embedding deben ser un número entero positivo',
        );
      }
    }
  }

  /**
   * Categoriza el tipo de error para mejor manejo
   */
  private categorizeError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'UNKNOWN_ERROR';
    }

    const message = error.message.toLowerCase();

    if (message.includes('documento') && message.includes('no encontr')) {
      return 'DOCUMENT_NOT_FOUND';
    }

    if (message.includes('chunks') && message.includes('no encontr')) {
      return 'NO_CHUNKS_FOUND';
    }

    if (message.includes('api') || message.includes('openai')) {
      return 'API_ERROR';
    }

    if (message.includes('validar') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
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

    return 'PROCESSING_ERROR';
  }
}
