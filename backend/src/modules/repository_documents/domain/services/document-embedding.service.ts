import { Injectable } from '@nestjs/common';
import type { DocumentChunk } from '../entities/document-chunk.entity';
import type {
  EmbeddingGeneratorPort,
  EmbeddingConfig,
  BatchEmbeddingResult,
} from '../ports/embedding-generator.port';
import type {
  VectorSearchPort,
  SemanticSearchResult,
  VectorSearchOptions,
} from '../ports/vector-search.port';
import type { DocumentChunkRepositoryPort } from '../ports/document-chunk-repository.port';

/**
 * Options for document embedding generation
 */
export interface DocumentEmbeddingOptions {
  embeddingConfig?: Partial<EmbeddingConfig>;
  replaceExisting?: boolean;
  batchSize?: number;
  chunkFilters?: {
    chunkTypes?: string[];
    chunkIndices?: number[];
    minContentLength?: number;
  };
}

/**
 * Result of document embedding processing
 */
export interface DocumentEmbeddingResult {
  documentId: string;
  batchResults: BatchEmbeddingResult[];
  totalChunksProcessed: number;
  chunksSkipped: number;
  chunksWithErrors: number;
  totalProcessingTimeMs: number;
  estimatedCost?: {
    totalTokens: number;
    costPerToken?: number;
    totalCost?: number;
  };
  errors?: string[];
}

/**
 * Domain service for document embeddings management
 */
@Injectable()
export class DocumentEmbeddingService {
  constructor(
    private readonly embeddingGenerator: EmbeddingGeneratorPort,
    private readonly vectorSearch: VectorSearchPort,
    private readonly chunkRepository: DocumentChunkRepositoryPort,
  ) {}

  /**
   * Generate embeddings for all chunks of a document
   */
  async generateDocumentEmbeddings(
    documentId: string,
    options: DocumentEmbeddingOptions = {},
  ): Promise<DocumentEmbeddingResult> {
    const startTime = Date.now();

    try {
      const chunksResult =
        await this.chunkRepository.findByDocumentId(documentId);
      let chunks = chunksResult.chunks;

      if (chunks.length === 0) {
        throw new Error(`No chunks found for document ${documentId}`);
      }

      chunks = this.applyChunkFilters(chunks, options.chunkFilters);

      if (!options.replaceExisting) {
        chunks = this.filterChunksWithoutEmbeddings(chunks);
      }

      const validChunks = chunks.filter((chunk) =>
        this.embeddingGenerator.validateText(chunk.content),
      );

      if (validChunks.length === 0) {
        throw new Error('No valid chunks to process embeddings');
      }

      const batchSize = options.batchSize || 20;
      const batchResults: BatchEmbeddingResult[] = [];
      let totalChunksProcessed = 0;
      let chunksWithErrors = 0;
      const errors: string[] = [];

      for (let i = 0; i < validChunks.length; i += batchSize) {
        const batch = validChunks.slice(i, i + batchSize);
        const texts = batch.map((chunk) => chunk.content);

        try {
          const batchResult =
            await this.embeddingGenerator.generateBatchEmbeddings(
              texts,
              options.embeddingConfig,
            );

          this.storeEmbeddings(batch);

          batchResults.push(batchResult);
          totalChunksProcessed += batchResult.totalEmbeddings;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(
            `Error processing batch ${i / batchSize + 1}: ${errorMessage}`,
          );
          chunksWithErrors += batch.length;
        }
      }

      const totalProcessingTimeMs = Date.now() - startTime;

      const totalTokens = batchResults.reduce(
        (sum, result) => sum + result.totalTokensUsed,
        0,
      );
      const chunksSkipped = chunksResult.chunks.length - validChunks.length;

      return {
        documentId,
        batchResults,
        totalChunksProcessed,
        chunksSkipped,
        chunksWithErrors,
        totalProcessingTimeMs,
        estimatedCost: {
          totalTokens,
          costPerToken: 0.00002,
          totalCost: totalTokens * 0.00002,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Error generating embeddings for document ${documentId}: ${errorMessage}`,
      );
    }
  }

  /**
   * Perform semantic search on all documents
   */
  async searchDocuments(
    query: string,
    options?: VectorSearchOptions,
  ): Promise<SemanticSearchResult> {
    return this.vectorSearch.searchByText(query, options);
  }

  /**
   * Find chunks similar to a specific one
   */
  async findSimilarChunks(chunkId: string, options?: VectorSearchOptions) {
    return this.vectorSearch.findSimilarChunks(chunkId, options);
  }

  /**
   * Find documents similar to a specific one
   */
  async findSimilarDocuments(
    documentId: string,
    options?: VectorSearchOptions,
  ) {
    return this.vectorSearch.findSimilarDocuments(documentId, options);
  }

  /**
   * Check if a document has generated embeddings
   */
  async hasEmbeddings(documentId: string): Promise<boolean> {
    const chunks = await this.chunkRepository.findByDocumentId(documentId);
    return chunks.chunks.length > 0;
  }

  /**
   * Apply filters to chunks
   */
  private applyChunkFilters(
    chunks: DocumentChunk[],
    filters?: DocumentEmbeddingOptions['chunkFilters'],
  ): DocumentChunk[] {
    if (!filters) return chunks;

    let filtered = chunks;

    if (filters.chunkTypes) {
      filtered = filtered.filter((chunk) =>
        filters.chunkTypes!.includes(chunk.type),
      );
    }

    if (filters.chunkIndices) {
      filtered = filtered.filter((chunk) =>
        filters.chunkIndices!.includes(chunk.chunkIndex),
      );
    }

    if (filters.minContentLength) {
      filtered = filtered.filter(
        (chunk) => chunk.content.length >= filters.minContentLength!,
      );
    }

    return filtered;
  }

  /**
   * Filter chunks that already have embeddings
   * TODO: Implement real verification with pgvector
   */
  private filterChunksWithoutEmbeddings(
    chunks: DocumentChunk[],
  ): DocumentChunk[] {
    return chunks;
  }

  /**
   * Store embeddings in database
   * TODO: Implement real update with pgvector
   */
  private storeEmbeddings(chunks: DocumentChunk[]): void {
    console.log(`Storing ${chunks.length} embeddings...`);
  }
}
