import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import type { TextExtractionPort } from '../../domain/ports/text-extraction.port';
import type { ChunkingStrategyPort } from '../../domain/ports/chunking-strategy.port';
import type { EmbeddingGeneratorPort } from '../../domain/ports/embedding-generator.port';
import type { VectorSearchPort } from '../../domain/ports/vector-search.port';
import type { DocumentChunkRepositoryPort } from '../../domain/ports/document-chunk-repository.port';
import {
  CheckDocumentSimilarityRequest,
  DocumentSimilarityResult,
  DocumentMatch,
  SimilarDocumentCandidate,
  DocumentScore,
} from '../../domain/value-objects/document-similarity-check.vo';

@Injectable()
export class CheckDocumentSimilarityUseCase {
  private readonly logger = new Logger(CheckDocumentSimilarityUseCase.name);

  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly textExtraction: TextExtractionPort,
    private readonly chunkingStrategy: ChunkingStrategyPort,
    private readonly embeddingGenerator: EmbeddingGeneratorPort,
    private readonly vectorSearch: VectorSearchPort,
    private readonly chunkRepository: DocumentChunkRepositoryPort,
  ) {}

  async execute(
    request: CheckDocumentSimilarityRequest,
  ): Promise<DocumentSimilarityResult> {
    try {
      this.logger.log(`Starting similarity check for: ${request.originalName}`);

      // Step 1: Check exact binary hash (SHA-256)
      const fileHash = this.generateFileHash(request.file);
      const exactMatch = await this.documentRepository.findByFileHash(fileHash);

      if (exactMatch) {
        this.logger.log(`Found exact binary match: ${exactMatch.id}`);
        return new DocumentSimilarityResult(
          'exact_match',
          new DocumentMatch(
            exactMatch.id,
            exactMatch.originalName,
            exactMatch.uploadedAt,
            exactMatch.uploadedBy,
            'binary_hash',
            exactMatch.documentTitle,
            exactMatch.documentAuthor,
          ),
        );
      }

      // Step 2: Extract text and check text hash
      const extractedText = await this.textExtraction.extractTextFromPdf(
        request.file,
        request.originalName,
      );

      const textHash = this.generateTextHash(extractedText.content);
      
      // Check for text hash match (same content, possibly different edition)
      const textHashMatch = await this.documentRepository.findByTextHash(textHash);
      if (textHashMatch) {
        this.logger.log(
          `Text hash match found for document: ${textHashMatch.id}`,
        );
        return new DocumentSimilarityResult(
          'text_hash_match',
          new DocumentMatch(
            textHashMatch.id,
            textHashMatch.originalName,
            textHashMatch.uploadedAt,
            textHashMatch.uploadedBy,
            'text_hash',
            textHashMatch.documentTitle,
            textHashMatch.documentAuthor,
          ),
        );
      }

      // Step 3: Skip embeddings if requested
      if (request.options?.skipEmbeddings) {
        return new DocumentSimilarityResult('no_match');
      }

      // Step 4: Generate chunks and embeddings for similarity check
      const similarCandidates = await this.findSimilarDocuments(
        extractedText.content,
        request.options?.similarityThreshold ?? 0.8,
        request.options?.maxCandidates ?? 10,
        request.options?.useSampling ?? true,
      );

      if (similarCandidates.length > 0) {
        this.logger.log(
          `Found ${similarCandidates.length} similar candidates`,
        );
        return new DocumentSimilarityResult(
          'candidates',
          undefined,
          similarCandidates,
          `Found ${similarCandidates.length} similar documents`,
        );
      }

      this.logger.log('No similar documents found');
      return new DocumentSimilarityResult('no_match');
    } catch (error) {
      this.logger.error(`Error checking document similarity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generates SHA-256 hash of the file buffer
   */
  private generateFileHash(fileBuffer: Buffer): string {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Generates hash of normalized text content
   */
  private generateTextHash(text: string): string {
    // Normalize text: lowercase, remove extra whitespace, normalize line breaks
    const normalizedText = text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\r\n/g, '\n')
      .trim();

    return createHash('sha256').update(normalizedText, 'utf8').digest('hex');
  }

  /**
   * Find similar documents using embeddings and vector search
   */
  private async findSimilarDocuments(
    text: string,
    threshold: number,
    maxCandidates: number,
    useSampling: boolean,
  ): Promise<SimilarDocumentCandidate[]> {
    try {
      // Step 1: Generate chunks - need documentId for chunking
      const tempDocumentId = 'temp-similarity-check';
      const defaultConfig = this.chunkingStrategy.getDefaultConfig();
      
      const chunkingResult = await this.chunkingStrategy.chunkText(
        tempDocumentId,
        text,
        {
          ...defaultConfig,
          maxChunkSize: 1000,
          overlap: 200,
        },
      );

      // Step 2: Sample chunks if requested (for faster processing)
      const chunksToProcess = useSampling
        ? this.sampleChunks(chunkingResult.chunks, 20)
        : chunkingResult.chunks;

      this.logger.log(
        `Processing ${chunksToProcess.length} chunks (sampling: ${useSampling})`,
      );

      // Step 3: Generate embeddings for chunks
      const chunkContents = chunksToProcess.map(
        (chunk: any) => chunk.content as string,
      );
      const embeddingResult =
        await this.embeddingGenerator.generateBatchEmbeddings(chunkContents);

      // Step 4: Search for similar chunks
      const documentScores = new Map<string, DocumentScore>();

      for (let i = 0; i < embeddingResult.embeddings.length; i++) {
        const embedding = embeddingResult.embeddings[i];
        const searchResults = await this.vectorSearch.searchByVector(
          embedding,
          {
            limit: 5, // Top 5 matches per chunk
            similarityThreshold: 0.7, // Minimum similarity for individual chunks
          },
        );

        // Aggregate results by document
        for (const result of searchResults.chunks) {
          const docId = result.documentId;
          if (!documentScores.has(docId)) {
            documentScores.set(docId, {
              documentId: docId,
              similarities: [],
              matchedChunks: 0,
              totalChunks: chunksToProcess.length,
              avgSimilarity: 0,
              coverage: 0,
              finalScore: 0,
            });
          }

          const docScore = documentScores.get(docId)!;
          docScore.similarities.push(result.similarityScore);
          docScore.matchedChunks++;
        }
      }

      // Step 5: Calculate final scores and filter candidates
      const candidates: SimilarDocumentCandidate[] = [];

      for (const [documentId, score] of documentScores) {
        // Calculate metrics
        score.avgSimilarity =
          score.similarities.reduce((sum, sim) => sum + sim, 0) /
          score.similarities.length;
        score.coverage = score.matchedChunks / score.totalChunks;
        score.finalScore = 0.7 * score.avgSimilarity + 0.3 * score.coverage;

        // Filter by threshold
        if (score.finalScore >= threshold) {
          // Get document details
          const document = await this.documentRepository.findById(documentId);
          if (document) {
            candidates.push(
              new SimilarDocumentCandidate(
                document.id,
                document.originalName,
                document.uploadedAt,
                document.uploadedBy,
                score.finalScore,
                score.avgSimilarity,
                score.coverage,
                score.matchedChunks,
                score.totalChunks,
                document.documentTitle,
                document.documentAuthor,
              ),
            );
          }
        }
      }

      // Sort by score (highest first) and limit results
      return candidates
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, maxCandidates);
    } catch (error) {
      this.logger.error(
        `Error finding similar documents: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Sample chunks for faster processing
   * Takes chunks from beginning, middle, and end of document
   */
  private sampleChunks(chunks: any[], maxSamples: number): any[] {
    if (chunks.length <= maxSamples) {
      return chunks;
    }

    const sampled: any[] = [];
    const step = chunks.length / maxSamples;

    // Take samples distributed across the document
    for (let i = 0; i < maxSamples; i++) {
      const index = Math.floor(i * step);
      sampled.push(chunks[index]);
    }

    return sampled;
  }
}