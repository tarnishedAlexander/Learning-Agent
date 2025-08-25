import { Injectable } from '@nestjs/common';
import { DocumentEmbeddingService } from '../../domain/services/document-embedding.service';
import type {
  DocumentEmbeddingOptions,
  DocumentEmbeddingResult,
} from '../../domain/services/document-embedding.service';

/**
 * Request DTO for document embeddings generation
 */
export interface GenerateDocumentEmbeddingsRequest {
  documentId: string;
  embeddingConfig?: {
    model?: string;
    dimensions?: number;
    additionalConfig?: Record<string, any>;
  };
  replaceExisting?: boolean;
  batchSize?: number;
  chunkFilters?: {
    chunkTypes?: string[];
    chunkIndices?: number[];
    minContentLength?: number;
  };
}

/**
 * Response for document embeddings generation
 */
export interface GenerateDocumentEmbeddingsResponse {
  success: boolean;
  result?: DocumentEmbeddingResult;
  error?: string;
  errorCode?: string;
}

/**
 * Use case for generating document embeddings
 */
@Injectable()
export class GenerateDocumentEmbeddingsUseCase {
  constructor(
    private readonly documentEmbeddingService: DocumentEmbeddingService,
  ) {}

  /**
   * Execute embeddings generation for a document
   */
  async execute(
    request: GenerateDocumentEmbeddingsRequest,
  ): Promise<GenerateDocumentEmbeddingsResponse> {
    try {
      this.validateRequest(request);

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

      const result =
        await this.documentEmbeddingService.generateDocumentEmbeddings(
          request.documentId,
          options,
        );

      if (result.chunksWithErrors > 0) {
        console.warn(
          `Some chunks had errors: ${result.chunksWithErrors}/${result.totalChunksProcessed + result.chunksWithErrors}`,
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
        'Error in GenerateDocumentEmbeddingsUseCase:',
        errorMessage,
      );

      return {
        success: false,
        error: errorMessage,
        errorCode: this.categorizeError(error),
      };
    }
  }

  /**
   * Validate embeddings generation request
   */
  private validateRequest(request: GenerateDocumentEmbeddingsRequest): void {
    if (!request.documentId || typeof request.documentId !== 'string') {
      throw new Error('Document ID is required and must be a valid string');
    }

    if (request.documentId.trim().length === 0) {
      throw new Error('Document ID cannot be empty');
    }

    if (request.batchSize !== undefined) {
      if (!Number.isInteger(request.batchSize) || request.batchSize < 1) {
        throw new Error('Batch size must be a positive integer');
      }

      if (request.batchSize > 2048) {
        throw new Error('Batch size cannot be greater than 2048');
      }
    }

    if (request.chunkFilters) {
      if (request.chunkFilters.chunkIndices) {
        const invalidIndices = request.chunkFilters.chunkIndices.filter(
          (index) => !Number.isInteger(index) || index < 0,
        );

        if (invalidIndices.length > 0) {
          throw new Error('Chunk indices must be non-negative integers');
        }
      }

      if (request.chunkFilters.minContentLength !== undefined) {
        if (
          !Number.isInteger(request.chunkFilters.minContentLength) ||
          request.chunkFilters.minContentLength < 0
        ) {
          throw new Error(
            'Minimum content length must be a non-negative integer',
          );
        }
      }
    }

    if (request.embeddingConfig?.dimensions !== undefined) {
      if (
        !Number.isInteger(request.embeddingConfig.dimensions) ||
        request.embeddingConfig.dimensions < 1
      ) {
        throw new Error('Embedding dimensions must be a positive integer');
      }
    }
  }

  /**
   * Categorize error type for better handling
   */
  private categorizeError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'UNKNOWN_ERROR';
    }

    const message = error.message.toLowerCase();

    if (message.includes('document') && message.includes('not found')) {
      return 'DOCUMENT_NOT_FOUND';
    }

    if (message.includes('chunks') && message.includes('not found')) {
      return 'NO_CHUNKS_FOUND';
    }

    if (message.includes('api') || message.includes('openai')) {
      return 'API_ERROR';
    }

    if (message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }

    if (message.includes('database')) {
      return 'DATABASE_ERROR';
    }

    if (message.includes('network') || message.includes('timeout')) {
      return 'NETWORK_ERROR';
    }

    return 'PROCESSING_ERROR';
  }
}
