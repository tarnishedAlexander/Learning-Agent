import { Injectable } from '@nestjs/common';
import { DocumentEmbeddingService } from '../../domain/services/document-embedding.service';
import type {
  VectorSearchOptions,
  SemanticSearchResult,
} from '../../domain/ports/vector-search.port';

/**
 * Request DTO for semantic search
 */
export interface SearchDocumentsRequest {
  query: string;
  searchOptions?: {
    limit?: number;
    similarityThreshold?: number;
    documentIds?: string[];
    chunkTypes?: string[];
    additionalFilters?: Record<string, any>;
  };
  includeMetadata?: boolean;
  includeContent?: boolean;
}

/**
 * Response for semantic search
 */
export interface SearchDocumentsResponse {
  success: boolean;
  result?: SemanticSearchResult;
  error?: string;
  errorCode?: string;
  searchInfo?: {
    processingTimeMs: number;
    processedQuery: string;
    appliedOptions: VectorSearchOptions;
  };
}

/**
 * Use case for semantic document search
 */
@Injectable()
export class SearchDocumentsUseCase {
  constructor(
    private readonly documentEmbeddingService: DocumentEmbeddingService,
  ) {}

  /**
   * Execute semantic search on documents
   */
  async execute(
    request: SearchDocumentsRequest,
  ): Promise<SearchDocumentsResponse> {
    const startTime = Date.now();

    try {
      this.validateRequest(request);

      const searchOptions = this.prepareSearchOptions(request);

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
      console.error('Error in SearchDocumentsUseCase:', errorMessage);

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

  /**
   * Validate search request
   */
  private validateRequest(request: SearchDocumentsRequest): void {
    if (!request.query || typeof request.query !== 'string') {
      throw new Error('Search query is required and must be a valid string');
    }

    const trimmedQuery = request.query.trim();
    if (trimmedQuery.length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (trimmedQuery.length < 3) {
      throw new Error('Search query must have at least 3 characters');
    }

    if (trimmedQuery.length > 8000) {
      throw new Error('Search query is too long (maximum 8000 characters)');
    }

    if (request.searchOptions) {
      const { limit, similarityThreshold, documentIds } = request.searchOptions;

      if (limit !== undefined) {
        if (!Number.isInteger(limit) || limit < 1) {
          throw new Error('Limit must be a positive integer');
        }

        if (limit > 1000) {
          throw new Error('Limit cannot be greater than 1000 results');
        }
      }

      if (similarityThreshold !== undefined) {
        if (
          typeof similarityThreshold !== 'number' ||
          similarityThreshold < 0 ||
          similarityThreshold > 1
        ) {
          throw new Error(
            'Similarity threshold must be a number between 0 and 1',
          );
        }
      }

      if (documentIds && Array.isArray(documentIds)) {
        if (documentIds.length === 0) {
          throw new Error(
            'If document IDs are specified, there must be at least one',
          );
        }

        const invalidIds = documentIds.filter(
          (id) => !id || typeof id !== 'string',
        );
        if (invalidIds.length > 0) {
          throw new Error('All document IDs must be valid non-empty strings');
        }
      }
    }
  }

  /**
   * Prepare vector search options
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
   * Categorize error type for better handling
   */
  private categorizeError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'UNKNOWN_ERROR';
    }

    const message = error.message.toLowerCase();

    if (message.includes('query')) {
      return 'INVALID_QUERY';
    }

    if (message.includes('embedding') || message.includes('vector')) {
      return 'EMBEDDING_ERROR';
    }

    if (message.includes('search')) {
      return 'SEARCH_ERROR';
    }

    if (message.includes('api') || message.includes('openai')) {
      return 'API_ERROR';
    }

    if (message.includes('database')) {
      return 'DATABASE_ERROR';
    }

    if (message.includes('network') || message.includes('timeout')) {
      return 'NETWORK_ERROR';
    }

    if (message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }

    return 'PROCESSING_ERROR';
  }
}
