import type { PrismaService } from '../../../../core/prisma/prisma.service';
import type {
  VectorSearchPort,
  VectorSearchOptions,
  VectorSearchResult,
  SemanticSearchResult,
  SimilarDocument,
} from '../../domain/ports/vector-search.port';
import type { EmbeddingGeneratorPort } from '../../domain/ports/embedding-generator.port';

/**
 * Opciones de configuración para pgvector
 */
export interface PgVectorConfig {
  /** Función de distancia a utilizar */
  distanceFunction: 'cosine' | 'euclidean' | 'inner_product';

  /** Configuración del índice HNSW */
  indexConfig?: {
    /** Número de conexiones por nodo */
    m?: number;

    /** Tamaño del buffer de construcción */
    efConstruction?: number;

    /** Factor de búsqueda */
    ef?: number;
  };
}

/**
 * Adaptador para búsqueda vectorial usando pgvector
 *
 * Implementa búsquedas por similaridad semántica utilizando
 * la extensión pgvector de PostgreSQL
 */
export class PgVectorSearchAdapter implements VectorSearchPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingGenerator: EmbeddingGeneratorPort,
    private readonly config: PgVectorConfig = {
      distanceFunction: 'cosine',
    },
  ) {}

  /**
   * Busca chunks similares usando un vector de embedding
   */
  async searchByVector(
    queryVector: number[],
    options: VectorSearchOptions = {},
  ): Promise<VectorSearchResult> {
    try {
      // 1. Validar entrada
      this.validateVector(queryVector);
      const finalOptions = this.normalizeOptions(options);

      // 2. Construir consulta SQL
      const distanceOperator = this.getDistanceOperator();
      const orderDirection = this.getOrderDirection();

      // 3. Construir filtros WHERE
      const whereConditions = this.buildWhereConditions(finalOptions);
      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(' AND ')}`
          : '';

      // 4. Ejecutar consulta
      const query = `
        SELECT 
          dc.id,
          dc.document_id,
          dc.chunk_index,
          dc.content,
          dc.type,
          dc.word_count,
          dc.char_count,
          dc.start_position,
          dc.end_position,
          dc.metadata,
          dc.created_at,
          d.title as document_title,
          d.file_name as document_file_name,
          d.file_size as document_file_size,
          d.content_type as document_content_type,
          (dc.embedding ${distanceOperator} $1::vector) as similarity_score
        FROM document_chunks dc
        INNER JOIN documents d ON dc.document_id = d.id
        ${whereClause}
        ${
          finalOptions.similarityThreshold
            ? `AND (dc.embedding ${distanceOperator} $1::vector) ${this.getThresholdOperator()} $${whereConditions.length + 2}`
            : ''
        }
        ORDER BY dc.embedding ${distanceOperator} $1::vector ${orderDirection}
        LIMIT $${finalOptions.similarityThreshold ? whereConditions.length + 3 : whereConditions.length + 2}
      `;

      // 5. Preparar parámetros
      const params: any[] = [JSON.stringify(queryVector)];
      // Agregar parámetros de filtros WHERE aquí si los hay

      if (finalOptions.similarityThreshold) {
        params.push(finalOptions.similarityThreshold);
      }
      params.push(finalOptions.limit);

      // 6. Ejecutar consulta (por ahora simulada)
      // En implementación real: const results = await this.prisma.$queryRawUnsafe(query, ...params);
      console.log('🔍 Ejecutando búsqueda vectorial:', {
        vectorDimensions: queryVector.length,
        options: finalOptions,
        query:
          typeof query === 'string'
            ? query.replace(/\s+/g, ' ').trim()
            : 'vector search',
      });

      // Simular resultados por ahora
      const results = await this.simulateVectorSearch(
        queryVector,
        finalOptions,
      );

      return {
        chunks: results,
        totalResults: results.length,
        searchOptions: finalOptions,
        processingTimeMs: 0, // Calcular tiempo real
      };
    } catch (error) {
      console.error('❌ Error en búsqueda vectorial:', error);
      throw this.handleSearchError(error, 'searchByVector');
    }
  }

  /**
   * Busca chunks similares convirtiendo texto a vector primero
   */
  async searchByText(
    query: string,
    options: VectorSearchOptions = {},
  ): Promise<SemanticSearchResult> {
    try {
      // Validar entrada
      if (!query || typeof query !== 'string') {
        throw new Error('El query de búsqueda debe ser una cadena válida');
      }

      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) {
        throw new Error('El query de búsqueda no puede estar vacío');
      }

      // 1. Generar embedding del texto de consulta
      const embeddingResult =
        await this.embeddingGenerator.generateEmbedding(trimmedQuery);

      // 2. Buscar usando el vector
      const vectorResult = await this.searchByVector(
        embeddingResult.embedding,
        options,
      );

      return {
        query: trimmedQuery,
        queryEmbedding: embeddingResult,
        searchResult: vectorResult,
        totalResults: vectorResult.totalResults,
        processingTimeMs: vectorResult.processingTimeMs,
      };
    } catch (error) {
      console.error('❌ Error en búsqueda por texto:', error);
      throw this.handleSearchError(error, 'searchByText');
    }
  }

  /**
   * Encuentra chunks similares a uno específico
   */
  async findSimilarChunks(
    chunkId: string,
    options: VectorSearchOptions = {},
  ): Promise<VectorSearchResult> {
    try {
      // 1. Obtener el chunk de referencia
      const referenceChunk = await this.getChunkEmbedding(chunkId);
      if (!referenceChunk) {
        throw new Error(`No se encontró el chunk con ID: ${chunkId}`);
      }

      // 2. Buscar chunks similares excluyendo el mismo
      const finalOptions = {
        ...options,
        excludeChunkIds: [...(options.excludeChunkIds || []), chunkId],
      };

      return this.searchByVector(referenceChunk.embedding, finalOptions);
    } catch (error) {
      console.error('❌ Error encontrando chunks similares:', error);
      throw this.handleSearchError(error, 'findSimilarChunks');
    }
  }

  /**
   * Encuentra documentos similares a uno específico
   */
  async findSimilarDocuments(
    documentId: string,
    options: VectorSearchOptions = {},
  ): Promise<SimilarDocument[]> {
    try {
      // 1. Obtener embeddings promedio del documento
      const documentEmbedding =
        await this.getDocumentAverageEmbedding(documentId);
      if (!documentEmbedding) {
        throw new Error(
          `No se encontraron embeddings para el documento: ${documentId}`,
        );
      }

      // 2. Buscar documentos similares
      const finalOptions = {
        ...options,
        excludeDocumentIds: [...(options.excludeDocumentIds || []), documentId],
        groupByDocument: true,
      };

      const searchResult = await this.searchByVector(
        documentEmbedding,
        finalOptions,
      );

      // 3. Agrupar por documento y calcular similaridad promedio
      const documentMap = new Map<
        string,
        {
          chunks: typeof searchResult.chunks;
          totalSimilarity: number;
          maxSimilarity: number;
        }
      >();

      searchResult.chunks.forEach((chunk) => {
        const docId = chunk.documentId;
        if (!documentMap.has(docId)) {
          documentMap.set(docId, {
            chunks: [],
            totalSimilarity: 0,
            maxSimilarity: 0,
          });
        }

        const docData = documentMap.get(docId)!;
        docData.chunks.push(chunk);
        docData.totalSimilarity += chunk.similarityScore;
        docData.maxSimilarity = Math.max(
          docData.maxSimilarity,
          chunk.similarityScore,
        );
      });

      // 4. Convertir a SimilarDocument[]
      const similarDocuments: SimilarDocument[] = [];
      for (const [docId, data] of documentMap) {
        const firstChunk = data.chunks[0];
        similarDocuments.push({
          documentId: docId,
          title: firstChunk.documentTitle,
          fileName: firstChunk.documentFileName,
          averageSimilarity: data.totalSimilarity / data.chunks.length,
          maxSimilarity: data.maxSimilarity,
          relevantChunks: data.chunks.slice(0, 3), // Top 3 chunks más relevantes
          totalChunks: data.chunks.length,
        });
      }

      // 5. Ordenar por similaridad promedio
      similarDocuments.sort(
        (a, b) => b.averageSimilarity - a.averageSimilarity,
      );

      return similarDocuments.slice(0, options.limit || 10);
    } catch (error) {
      console.error('❌ Error encontrando documentos similares:', error);
      throw this.handleSearchError(error, 'findSimilarDocuments');
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Valida que el vector sea válido
   */
  private validateVector(vector: number[]): void {
    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('El vector debe ser un array no vacío de números');
    }

    if (vector.some((val) => typeof val !== 'number' || !isFinite(val))) {
      throw new Error(
        'Todos los elementos del vector deben ser números finitos',
      );
    }

    // Verificar dimensiones típicas
    if (![256, 512, 1024, 1536, 3072].includes(vector.length)) {
      console.warn(`⚠️ Dimensiones inusuales del vector: ${vector.length}`);
    }
  }

  /**
   * Normaliza las opciones de búsqueda
   */
  private normalizeOptions(
    options: VectorSearchOptions,
  ): Required<VectorSearchOptions> {
    return {
      limit: options.limit || 10,
      similarityThreshold: options.similarityThreshold || 0.7,
      includeMetadata: options.includeMetadata ?? true,
      includeContent: options.includeContent ?? true,
      documentIds: options.documentIds || [],
      chunkTypes: options.chunkTypes || [],
      excludeChunkIds: options.excludeChunkIds || [],
      excludeDocumentIds: options.excludeDocumentIds || [],
      groupByDocument: options.groupByDocument ?? false,
      additionalFilters: options.additionalFilters || {},
    };
  }

  /**
   * Obtiene el operador de distancia SQL según la configuración
   */
  private getDistanceOperator(): string {
    switch (this.config.distanceFunction) {
      case 'cosine':
        return '<->';
      case 'euclidean':
        return '<->';
      case 'inner_product':
        return '<#>';
      default:
        return '<->';
    }
  }

  /**
   * Obtiene la dirección de ordenamiento
   */
  private getOrderDirection(): string {
    return this.config.distanceFunction === 'inner_product' ? 'DESC' : 'ASC';
  }

  /**
   * Obtiene el operador de umbral
   */
  private getThresholdOperator(): string {
    return this.config.distanceFunction === 'inner_product' ? '>=' : '<=';
  }

  /**
   * Construye condiciones WHERE para filtros
   */
  private buildWhereConditions(
    options: Required<VectorSearchOptions>,
  ): string[] {
    const conditions: string[] = [];

    if (options.documentIds && options.documentIds.length > 0) {
      conditions.push(`dc.document_id = ANY($${conditions.length + 2})`);
    }

    if (options.chunkTypes && options.chunkTypes.length > 0) {
      conditions.push(`dc.type = ANY($${conditions.length + 2})`);
    }

    if (options.excludeChunkIds && options.excludeChunkIds.length > 0) {
      conditions.push(`dc.id NOT IN ($${conditions.length + 2})`);
    }

    if (options.excludeDocumentIds && options.excludeDocumentIds.length > 0) {
      conditions.push(`dc.document_id NOT IN ($${conditions.length + 2})`);
    }

    // Asegurar que tiene embedding
    conditions.push('dc.embedding IS NOT NULL');

    return conditions;
  }

  /**
   * Obtiene el embedding de un chunk específico
   */
  private async getChunkEmbedding(
    chunkId: string,
  ): Promise<{ embedding: number[] } | null> {
    // Por ahora simulado - en implementación real:
    // const result = await this.prisma.documentChunk.findUnique({
    //   where: { id: chunkId },
    //   select: { embedding: true }
    // });
    // return result?.embedding ? { embedding: JSON.parse(result.embedding) } : null;

    console.log('🔍 Obteniendo embedding para chunk:', chunkId);
    return null; // Simular por ahora
  }

  /**
   * Calcula el embedding promedio de un documento
   */
  private async getDocumentAverageEmbedding(
    documentId: string,
  ): Promise<number[] | null> {
    // Implementación real pendiente
    console.log('🔍 Calculando embedding promedio para documento:', documentId);
    return null; // Simular por ahora
  }

  /**
   * Simula resultados de búsqueda vectorial para desarrollo
   */
  private async simulateVectorSearch(
    queryVector: number[],
    options: Required<VectorSearchOptions>,
  ): Promise<any[]> {
    // Simulación para desarrollo - reemplazar con consulta real
    return [];
  }

  /**
   * Maneja errores de búsqueda
   */
  private handleSearchError(error: unknown, operation: string): Error {
    if (error instanceof Error) {
      return new Error(`Error en ${operation}: ${error.message}`);
    }
    return new Error(`Error desconocido en ${operation}`);
  }
}
