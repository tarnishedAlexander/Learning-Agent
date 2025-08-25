import type { DocumentChunk } from '../entities/document-chunk.entity';
import type {
  ChunkingStrategyPort,
  ChunkingConfig,
  ChunkingResult,
} from '../ports/chunking-strategy.port';
import type { DocumentChunkRepositoryPort } from '../ports/document-chunk-repository.port';

/**
 * Opciones para el procesamiento de chunks
 */
export interface ProcessChunksOptions {
  /** Configuración personalizada de chunking */
  chunkingConfig?: Partial<ChunkingConfig>;

  /** Si debe reemplazar chunks existentes */
  replaceExisting?: boolean;

  /** Tipo de chunk personalizado */
  chunkType?: string;
}

/**
 * Resultado del procesamiento completo de chunks
 */
export interface ProcessChunksResult {
  /** Resultado del chunking */
  chunkingResult: ChunkingResult;

  /** Chunks guardados en la base de datos */
  savedChunks: DocumentChunk[];

  /** Tiempo de procesamiento en milisegundos */
  processingTimeMs: number;

  /** Estado del procesamiento */
  status: 'success' | 'partial_success' | 'error';

  /** Mensajes de error si los hay */
  errors?: string[];
}

/**
 * Servicio de dominio para el chunking de documentos
 *
 * Coordina el proceso completo de división de texto en chunks
 * y su almacenamiento en el repositorio.
 */
export class DocumentChunkingService {
  constructor(
    private readonly chunkingStrategy: ChunkingStrategyPort,
    private readonly chunkRepository: DocumentChunkRepositoryPort,
  ) {}

  /**
   * Procesa un documento completo: chunking + almacenamiento
   *
   * @param documentId - ID del documento a procesar
   * @param extractedText - Texto extraído del documento
   * @param options - Opciones de procesamiento
   */
  async processDocumentChunks(
    documentId: string,
    extractedText: string,
    options: ProcessChunksOptions = {},
  ): Promise<ProcessChunksResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // 1. Validar entrada
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No hay texto para procesar');
      }

      // 2. Preparar configuración de chunking
      const defaultConfig = this.chunkingStrategy.getDefaultConfig();
      const chunkingConfig: ChunkingConfig = {
        ...defaultConfig,
        ...options.chunkingConfig,
      };

      // Validar configuración
      if (!this.chunkingStrategy.validateConfig(chunkingConfig)) {
        throw new Error('Configuración de chunking inválida');
      }

      // 3. Eliminar chunks existentes si se solicita reemplazo
      if (options.replaceExisting) {
        const hasExistingChunks =
          await this.chunkRepository.existsByDocumentId(documentId);
        if (hasExistingChunks) {
          await this.chunkRepository.deleteByDocumentId(documentId);
        }
      }

      // 4. Realizar chunking
      const chunkingResult = await this.chunkingStrategy.chunkText(
        documentId,
        extractedText,
        chunkingConfig,
      );

      if (chunkingResult.chunks.length === 0) {
        throw new Error('No se pudieron generar chunks del texto');
      }

      // 5. Aplicar tipo personalizado si se especifica
      if (options.chunkType) {
        chunkingResult.chunks.forEach((chunk) => {
          chunk.type = options.chunkType!;
        });
      }

      // 6. Guardar chunks en el repositorio
      const savedChunks = await this.chunkRepository.saveMany(
        chunkingResult.chunks,
      );

      const processingTimeMs = Date.now() - startTime;

      return {
        chunkingResult,
        savedChunks,
        processingTimeMs,
        status: 'success',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      errors.push(errorMessage);

      const processingTimeMs = Date.now() - startTime;

      return {
        chunkingResult: {
          chunks: [],
          totalChunks: 0,
          statistics: {
            averageChunkSize: 0,
            minChunkSize: 0,
            maxChunkSize: 0,
            actualOverlapPercentage: 0,
          },
        },
        savedChunks: [],
        processingTimeMs,
        status: 'error',
        errors,
      };
    }
  }

  /**
   * Obtiene los chunks de un documento con estadísticas
   */
  async getDocumentChunks(documentId: string) {
    const chunks = await this.chunkRepository.findByDocumentId(documentId);
    const statistics =
      await this.chunkRepository.getDocumentChunkStatistics(documentId);

    return {
      chunks: chunks.chunks,
      total: chunks.total,
      statistics,
    };
  }

  /**
   * Verifica si un documento tiene chunks procesados
   */
  async hasProcessedChunks(documentId: string): Promise<boolean> {
    return this.chunkRepository.existsByDocumentId(documentId);
  }

  /**
   * Re-procesa los chunks de un documento
   * (útil cuando cambia la estrategia o configuración)
   */
  async reprocessDocumentChunks(
    documentId: string,
    extractedText: string,
    options: ProcessChunksOptions = {},
  ): Promise<ProcessChunksResult> {
    return this.processDocumentChunks(documentId, extractedText, {
      ...options,
      replaceExisting: true,
    });
  }
}
