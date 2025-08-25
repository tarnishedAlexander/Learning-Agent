/**
 * Resultado de generación de embeddings
 */
export interface EmbeddingResult {
  /** Vector de embeddings generado */
  embedding: number[];

  /** Dimensiones del vector */
  dimensions: number;

  /** Modelo utilizado para generar el embedding */
  model: string;

  /** Número de tokens procesados */
  tokensUsed: number;

  /** Tiempo de procesamiento en milisegundos */
  processingTimeMs?: number;
}

/**
 * Resultado de generación de embeddings en lote
 */
export interface BatchEmbeddingResult {
  /** Vectores de embeddings generados */
  embeddings: number[][];

  /** Número total de embeddings generados */
  totalEmbeddings: number;

  /** Dimensiones de cada vector */
  dimensions: number;

  /** Tokens totales utilizados */
  totalTokensUsed: number;

  /** Modelo utilizado */
  model: string;

  /** Número de embeddings exitosos */
  successfulCount: number;

  /** Número de embeddings que fallaron */
  failedCount: number;

  /** Lista de errores encontrados */
  errors: string[];
}

/**
 * Configuración para generación de embeddings
 */
export interface EmbeddingConfig {
  /** Modelo a utilizar (ej: text-embedding-3-small, text-embedding-3-large) */
  model: string;

  /** Dimensiones del vector resultante (opcional, depende del modelo) */
  dimensions: number;

  /** Configuración adicional específica del proveedor */
  additionalConfig?: Record<string, any>;
}

/**
 * Puerto para generación de embeddings
 *
 * Abstrae diferentes proveedores de embeddings (OpenAI, Hugging Face, etc.)
 */
export interface EmbeddingGeneratorPort {
  /**
   * Genera embedding para un solo texto
   *
   * @param text - Texto a procesar
   * @param config - Configuración opcional
   * @returns Resultado con el vector de embeddings
   */
  generateEmbedding(
    text: string,
    config?: Partial<EmbeddingConfig>,
  ): Promise<EmbeddingResult>;

  /**
   * Genera embeddings para múltiples textos en lote (más eficiente)
   *
   * @param texts - Array de textos a procesar
   * @param config - Configuración opcional
   * @returns Resultados del lote completo
   */
  generateBatchEmbeddings(
    texts: string[],
    config?: Partial<EmbeddingConfig>,
  ): Promise<BatchEmbeddingResult>;

  /**
   * Valida que un texto sea apropiado para generar embeddings
   *
   * @param text - Texto a validar
   * @returns true si es válido, false en caso contrario
   */
  validateText(text: string): boolean;

  /**
   * Obtiene la configuración por defecto del generador
   */
  getDefaultConfig(): EmbeddingConfig;

  /**
   * Obtiene información sobre el modelo utilizado
   */
  getModelInfo(): {
    name: string;
    dimensions: number;
    maxTokens: number;
    costPerToken?: number;
  };
}
