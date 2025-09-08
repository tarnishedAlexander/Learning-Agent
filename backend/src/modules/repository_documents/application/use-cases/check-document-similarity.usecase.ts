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

  // paso 1: verificar hash binario exacto (sha-256)
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

  // paso 2: extraer texto y verificar hash de texto
      const extractedText = await this.textExtraction.extractTextFromPdf(
        request.file,
        request.originalName,
      );

      const textHash = this.generateTextHash(extractedText.content);

  // verificar coincidencia por hash de texto (mismo contenido, posible otra edición)
      const textHashMatch =
        await this.documentRepository.findByTextHash(textHash);
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

  // paso 3: omitir embeddings si se solicita
      if (request.options?.skipEmbeddings) {
        return new DocumentSimilarityResult('no_match');
      }

  // paso 4: generar chunks y embeddings para la verificación de similitud
      const similarCandidates = await this.findSimilarDocuments(
        extractedText.content,
        request.options?.similarityThreshold ?? 0.8,
        request.options?.maxCandidates ?? 10,
        request.options?.useSampling ?? true,
      );

      if (similarCandidates.length > 0) {
        this.logger.log(`Found ${similarCandidates.length} similar candidates`);
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

  // genera hash sha-256 del contenido del archivo
  private generateFileHash(fileBuffer: Buffer): string {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }

  // genera hash del texto normalizado
  private generateTextHash(text: string): string {
    // normalizar texto: minúsculas, quitar espacios extra y normalizar saltos de línea
    const normalizedText = text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\r\n/g, '\n')
      .trim();

    return createHash('sha256').update(normalizedText, 'utf8').digest('hex');
  }

  // buscar documentos similares usando embeddings y búsqueda vectorial
  private async findSimilarDocuments(
    text: string,
    threshold: number,
    maxCandidates: number,
    useSampling: boolean,
  ): Promise<SimilarDocumentCandidate[]> {
    try {
  // paso 1: generar chunks - se usa un id temporal
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

  // paso 2: muestrear chunks si se solicita (procesamiento más rápido)
      const chunksToProcess = useSampling
        ? this.sampleChunks(chunkingResult.chunks, 20)
        : chunkingResult.chunks;

      this.logger.log(
        `Processing ${chunksToProcess.length} chunks (sampling: ${useSampling})`,
      );

  // paso 3: generar embeddings para los chunks
      const chunkContents = chunksToProcess.map(
        (chunk: any) => chunk.content as string,
      );
      const embeddingResult =
        await this.embeddingGenerator.generateBatchEmbeddings(chunkContents);

  // paso 4: buscar chunks similares
      const documentScores = new Map<string, DocumentScore>();

      for (let i = 0; i < embeddingResult.embeddings.length; i++) {
        const embedding = embeddingResult.embeddings[i];
        const searchResults = await this.vectorSearch.searchByVector(
          embedding,
          {
            limit: 5, // 5 mejores coincidencias por chunk
            similarityThreshold: Math.max(0.3, threshold - 0.2), // más permisivo para chunks individuales
          },
        );

  // agregar resultados por documento
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

  // paso 5: calcular puntuaciones finales y filtrar candidatos
      const candidates: SimilarDocumentCandidate[] = [];

      for (const [documentId, score] of documentScores) {
  // calcular métricas
        score.avgSimilarity =
          score.similarities.reduce((sum, sim) => sum + sim, 0) /
          score.similarities.length;
        score.coverage = score.matchedChunks / score.totalChunks;
        score.finalScore = 0.7 * score.avgSimilarity + 0.3 * score.coverage;

  // filtrar por umbral
        if (score.finalScore >= threshold) {
          // obtener detalles del documento
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

  // ordenar por puntuación (mayor primero) y limitar resultados
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

  // muestrea chunks para procesamiento más rápido
  // toma chunks del inicio, medio y final del documento
  private sampleChunks(chunks: any[], maxSamples: number): any[] {
    if (chunks.length <= maxSamples) {
      return chunks;
    }

    const sampled: any[] = [];
    const step = chunks.length / maxSamples;

  // tomar muestras distribuidas a lo largo del documento
    for (let i = 0; i < maxSamples; i++) {
      const index = Math.floor(i * step);
      sampled.push(chunks[index]);
    }

    return sampled;
  }
}
