import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DocumentChunk } from '../../domain/entities/document-chunk.entity';
import type {
  ChunkingStrategyPort,
  ChunkingConfig,
  ChunkingResult,
} from '../../domain/ports/chunking-strategy.port';

/**
 * Adaptador para chunking semántico de texto
 *
 * Implementa una estrategia inteligente de división de texto que:
 * - Respeta párrafos y oraciones
 * - Mantiene contexto semántico
 * - Optimiza para embeddings
 * - Incluye solapamiento inteligente
 */
@Injectable()
export class SemanticTextChunkingAdapter implements ChunkingStrategyPort {
  private readonly logger = new Logger(SemanticTextChunkingAdapter.name);

  /**
   * Divide el texto en chunks usando estrategia semántica
   */
  async chunkText(
    documentId: string,
    text: string,
    config: ChunkingConfig,
  ): Promise<ChunkingResult> {
    this.logger.log(
      `Iniciando chunking semántico para documento ${documentId}: ` +
        `${text.length} caracteres, maxSize: ${config.maxChunkSize}, overlap: ${config.overlap}`,
    );

    const startTime = Date.now();

    // 1. Limpiar y normalizar texto
    const cleanText = this.cleanText(text);

    // 2. Dividir en párrafos si se respetan
    const paragraphs = config.respectParagraphs
      ? this.splitIntoParagraphs(cleanText)
      : [cleanText];

    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;

    // 3. Procesar cada párrafo
    for (const paragraph of paragraphs) {
      if (paragraph.trim().length < config.minChunkSize) {
        continue; // Saltar párrafos muy pequeños
      }

      // Si el párrafo cabe en un chunk, úsalo directamente
      if (paragraph.length <= config.maxChunkSize) {
        const chunk = this.createChunk(
          documentId,
          paragraph.trim(),
          chunkIndex++,
          'paragraph',
        );
        if (chunk) chunks.push(chunk);
        continue;
      }

      // Si el párrafo es muy grande, dividirlo
      const paragraphChunks = await this.chunkLargeText(
        documentId,
        paragraph,
        config,
        chunkIndex,
      );

      chunks.push(...paragraphChunks);
      chunkIndex += paragraphChunks.length;
    }

    // 4. Aplicar solapamiento inteligente
    const chunksWithOverlap = this.applyIntelligentOverlap(chunks, config);

    // 5. Calcular estadísticas
    const statistics = this.calculateStatistics(chunksWithOverlap, config);

    const processingTime = Date.now() - startTime;
    this.logger.log(
      `✅ Chunking completado en ${processingTime}ms: ${chunksWithOverlap.length} chunks generados`,
    );

    return {
      chunks: chunksWithOverlap,
      totalChunks: chunksWithOverlap.length,
      statistics,
    };
  }

  /**
   * Valida la configuración de chunking
   */
  validateConfig(config: ChunkingConfig): boolean {
    if (config.maxChunkSize <= 0) return false;
    if (config.overlap < 0 || config.overlap >= config.maxChunkSize)
      return false;
    if (config.minChunkSize <= 0 || config.minChunkSize > config.maxChunkSize)
      return false;
    return true;
  }

  /**
   * Configuración por defecto optimizada para embeddings
   */
  getDefaultConfig(): ChunkingConfig {
    return {
      maxChunkSize: 1000, // Tamaño óptimo para embeddings
      overlap: 100, // 10% de solapamiento
      respectParagraphs: true,
      respectSentences: true,
      minChunkSize: 50, // Mínimo para ser útil
    };
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Limpia y normaliza el texto
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalizar saltos de línea
      .replace(/\n{3,}/g, '\n\n') // Máximo 2 saltos seguidos
      .replace(/[ \t]+/g, ' ') // Espacios múltiples a uno
      .replace(/^\s+|\s+$/g, '') // Trim general
      .replace(/\s*\n\s*/g, '\n'); // Limpiar espacios alrededor de \n
  }

  /**
   * Divide el texto en párrafos
   */
  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/) // Dividir por doble salto
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  /**
   * Divide texto grande en chunks respetando oraciones
   */
  private async chunkLargeText(
    documentId: string,
    text: string,
    config: ChunkingConfig,
    startIndex: number,
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];

    if (config.respectSentences) {
      // Dividir por oraciones
      const sentences = this.splitIntoSentences(text);
      let currentChunk = '';
      let chunkIndex = startIndex;

      for (const sentence of sentences) {
        const potentialChunk =
          currentChunk + (currentChunk ? ' ' : '') + sentence;

        if (potentialChunk.length <= config.maxChunkSize) {
          currentChunk = potentialChunk;
        } else {
          // Guardar chunk actual si no está vacío
          if (currentChunk.trim()) {
            const chunk = this.createChunk(
              documentId,
              currentChunk.trim(),
              chunkIndex++,
              'sentence_group',
            );
            if (chunk) chunks.push(chunk);
          }

          // Comenzar nuevo chunk
          currentChunk = sentence;

          // Si una sola oración es muy grande, dividirla por palabras
          if (sentence.length > config.maxChunkSize) {
            const wordChunks = this.chunkByWords(
              documentId,
              sentence,
              config,
              chunkIndex,
            );
            chunks.push(...wordChunks);
            chunkIndex += wordChunks.length;
            currentChunk = '';
          }
        }
      }

      // Agregar último chunk si queda algo
      if (currentChunk.trim()) {
        const chunk = this.createChunk(
          documentId,
          currentChunk.trim(),
          chunkIndex,
          'sentence_group',
        );
        if (chunk) chunks.push(chunk);
      }
    } else {
      // División simple por palabras
      const wordChunks = this.chunkByWords(
        documentId,
        text,
        config,
        startIndex,
      );
      chunks.push(...wordChunks);
    }

    return chunks;
  }

  /**
   * Divide texto en oraciones
   */
  private splitIntoSentences(text: string): string[] {
    // Regex para detectar finales de oración (mejorado para español)
    const sentenceEnders = /[.!?]+\s+(?=[A-ZÁÉÍÓÚÑ])/g;

    return text
      .split(sentenceEnders)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * División por palabras cuando las oraciones son muy grandes
   */
  private chunkByWords(
    documentId: string,
    text: string,
    config: ChunkingConfig,
    startIndex: number,
  ): DocumentChunk[] {
    const words = text.split(/\s+/);
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let chunkIndex = startIndex;

    for (const word of words) {
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + word;

      if (potentialChunk.length <= config.maxChunkSize) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk.trim()) {
          const chunk = this.createChunk(
            documentId,
            currentChunk.trim(),
            chunkIndex++,
            'word_group',
          );
          if (chunk) chunks.push(chunk);
        }
        currentChunk = word;
      }
    }

    // Último chunk
    if (currentChunk.trim()) {
      const chunk = this.createChunk(
        documentId,
        currentChunk.trim(),
        chunkIndex,
        'word_group',
      );
      if (chunk) chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Aplica solapamiento inteligente entre chunks
   */
  private applyIntelligentOverlap(
    chunks: DocumentChunk[],
    config: ChunkingConfig,
  ): DocumentChunk[] {
    if (chunks.length <= 1 || config.overlap === 0) {
      return chunks;
    }

    const chunksWithOverlap = [...chunks];

    for (let i = 1; i < chunksWithOverlap.length; i++) {
      const prevChunk = chunksWithOverlap[i - 1];
      const currentChunk = chunksWithOverlap[i];

      // Obtener palabras del final del chunk anterior
      const prevWords = prevChunk.content.split(/\s+/);
      const overlapWords = Math.min(
        Math.floor(config.overlap / 10), // Estimación de palabras
        Math.floor(prevWords.length / 3), // Máximo 1/3 del chunk anterior
      );

      if (overlapWords > 0) {
        const overlapText = prevWords.slice(-overlapWords).join(' ');
        currentChunk.content = overlapText + ' ' + currentChunk.content;
      }
    }

    return chunksWithOverlap;
  }

  /**
   * Crea un chunk de documento
   */
  private createChunk(
    documentId: string,
    content: string,
    chunkIndex: number,
    type: string,
  ): DocumentChunk | null {
    if (!content || content.trim().length === 0) {
      return null;
    }

    return DocumentChunk.create(
      uuidv4(),
      documentId,
      content.trim(),
      chunkIndex,
      type,
      {
        contentLength: content.length,
        wordCount: content.split(/\s+/).length,
        position: chunkIndex,
      },
    );
  }

  /**
   * Calcula estadísticas del proceso de chunking
   */
  private calculateStatistics(chunks: DocumentChunk[], config: ChunkingConfig) {
    if (chunks.length === 0) {
      return {
        averageChunkSize: 0,
        minChunkSize: 0,
        maxChunkSize: 0,
        actualOverlapPercentage: 0,
      };
    }

    const sizes = chunks.map((chunk) => chunk.content.length);
    const totalSize = sizes.reduce((sum, size) => sum + size, 0);

    return {
      averageChunkSize: Math.round(totalSize / chunks.length),
      minChunkSize: Math.min(...sizes),
      maxChunkSize: Math.max(...sizes),
      actualOverlapPercentage:
        config.overlap > 0 ? (config.overlap / config.maxChunkSize) * 100 : 0,
    };
  }
}