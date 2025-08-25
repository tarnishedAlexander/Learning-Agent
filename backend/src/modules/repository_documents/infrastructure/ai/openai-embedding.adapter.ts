import OpenAI from 'openai';
import type {
  EmbeddingGeneratorPort,
  EmbeddingConfig,
  EmbeddingResult,
  BatchEmbeddingResult,
} from '../../domain/ports/embedding-generator.port';

/**
 * Configuración específica para OpenAI
 */
export interface OpenAIConfig {
  /** Clave API de OpenAI */
  apiKey: string;

  /** URL base de la API (opcional) */
  baseURL?: string;

  /** Organización (opcional) */
  organization?: string;

  /** Proyecto (opcional) */
  project?: string;

  /** Timeout en milisegundos */
  timeout?: number;

  /** Número máximo de reintentos */
  maxRetries?: number;
}

/**
 * Modelos de embeddings disponibles en OpenAI
 */
export enum OpenAIEmbeddingModel {
  TEXT_EMBEDDING_3_SMALL = 'text-embedding-3-small',
  TEXT_EMBEDDING_3_LARGE = 'text-embedding-3-large',
  TEXT_EMBEDDING_ADA_002 = 'text-embedding-ada-002',
}

/**
 * Dimensiones soportadas por cada modelo
 */
export const MODEL_DIMENSIONS = {
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_3_SMALL]: [512, 1536], // Default: 1536
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_3_LARGE]: [256, 1024, 3072], // Default: 3072
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_ADA_002]: [1536], // Fixed: 1536
} as const;

/**
 * Límites de tokens por modelo
 */
export const MODEL_TOKEN_LIMITS = {
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_3_SMALL]: 8191,
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_3_LARGE]: 8191,
  [OpenAIEmbeddingModel.TEXT_EMBEDDING_ADA_002]: 8191,
} as const;

/**
 * Adaptador para generación de embeddings usando OpenAI
 *
 * Implementa la interfaz EmbeddingGeneratorPort utilizando
 * los modelos de embeddings de OpenAI
 */
export class OpenAIEmbeddingAdapter implements EmbeddingGeneratorPort {
  private readonly client: OpenAI;
  private readonly defaultConfig: Required<EmbeddingConfig>;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
      project: config.project,
      timeout: config.timeout || 60000, // 60 segundos
      maxRetries: config.maxRetries || 3,
    });

    // Configuración por defecto
    this.defaultConfig = {
      model: OpenAIEmbeddingModel.TEXT_EMBEDDING_3_SMALL,
      dimensions: 1536,
      additionalConfig: {},
    };
  }

  /**
   * Genera embedding para un texto individual
   */
  async generateEmbedding(
    text: string,
    config?: Partial<EmbeddingConfig>,
  ): Promise<EmbeddingResult> {
    try {
      // 1. Validar entrada
      this.validateText(text);

      // 2. Preparar configuración
      const finalConfig = this.mergeConfig(config);

      // 3. Llamar a OpenAI
      const response = await this.client.embeddings.create({
        model: finalConfig.model,
        input: text,
        dimensions: this.shouldIncludeDimensions(finalConfig.model)
          ? finalConfig.dimensions
          : undefined,
        encoding_format: 'float',
        ...finalConfig.additionalConfig,
      });

      // 4. Procesar respuesta
      const embedding = response.data[0];
      if (!embedding || !embedding.embedding) {
        throw new Error('No se recibió embedding válido de OpenAI');
      }

      return {
        embedding: embedding.embedding,
        dimensions: embedding.embedding.length,
        tokensUsed: response.usage.total_tokens,
        model: finalConfig.model,
      };
    } catch (error) {
      console.error('❌ Error generando embedding:', error);
      throw this.handleOpenAIError(error, 'generateEmbedding');
    }
  }

  /**
   * Genera embeddings para múltiples textos en lote
   */
  async generateBatchEmbeddings(
    texts: string[],
    config?: Partial<EmbeddingConfig>,
  ): Promise<BatchEmbeddingResult> {
    try {
      // 1. Validar entrada
      if (!texts || texts.length === 0) {
        throw new Error('Se requiere al menos un texto para procesar');
      }

      if (texts.length > 2048) {
        throw new Error('OpenAI soporta máximo 2048 inputs por lote');
      }

      // Validar cada texto
      texts.forEach((text, index) => {
        try {
          this.validateText(text);
        } catch (error) {
          throw new Error(
            `Texto inválido en índice ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      });

      // 2. Preparar configuración
      const finalConfig = this.mergeConfig(config);

      // 3. Llamar a OpenAI
      const response = await this.client.embeddings.create({
        model: finalConfig.model,
        input: texts,
        dimensions: this.shouldIncludeDimensions(finalConfig.model)
          ? finalConfig.dimensions
          : undefined,
        encoding_format: 'float',
        ...finalConfig.additionalConfig,
      });

      // 4. Procesar respuesta
      if (!response.data || response.data.length !== texts.length) {
        throw new Error(
          `Número de embeddings recibidos (${response.data?.length || 0}) no coincide con textos enviados (${texts.length})`,
        );
      }

      const embeddings = response.data.map((item) => ({
        embedding: item.embedding,
        dimensions: item.embedding.length,
        index: item.index,
      }));

      // Ordenar por índice para mantener correspondencia
      embeddings.sort((a, b) => a.index - b.index);

      return {
        embeddings: embeddings.map((item) => item.embedding),
        totalEmbeddings: embeddings.length,
        dimensions: embeddings[0]?.dimensions || 0,
        totalTokensUsed: response.usage.total_tokens,
        model: finalConfig.model,
        successfulCount: embeddings.length,
        failedCount: 0,
        errors: [],
      };
    } catch (error) {
      console.error('❌ Error generando embeddings en lote:', error);
      throw this.handleOpenAIError(error, 'generateBatchEmbeddings');
    }
  }

  /**
   * Valida si un texto es apto para generar embeddings
   */
  validateText(text: string): boolean {
    if (!text || typeof text !== 'string') {
      throw new Error('El texto debe ser una cadena válida no vacía');
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      throw new Error('El texto no puede estar vacío');
    }

    if (trimmed.length > 50000) {
      // Límite aproximado antes de tokenización
      throw new Error('El texto es demasiado largo para procesar');
    }

    return true;
  }

  /**
   * Obtiene información sobre los modelos disponibles
   */
  getAvailableModels(): string[] {
    return Object.values(OpenAIEmbeddingModel);
  }

  /**
   * Obtiene las dimensiones soportadas por un modelo
   */
  getModelDimensions(model: string): number[] {
    if (model in MODEL_DIMENSIONS) {
      return [...MODEL_DIMENSIONS[model as OpenAIEmbeddingModel]];
    }
    return [1536]; // Dimensión por defecto
  }

  /**
   * Obtiene el límite de tokens para un modelo
   */
  getModelTokenLimit(model: string): number {
    if (model in MODEL_TOKEN_LIMITS) {
      return MODEL_TOKEN_LIMITS[model as OpenAIEmbeddingModel];
    }
    return 8191; // Límite por defecto
  }

  /**
   * Obtiene configuración por defecto
   */
  getDefaultConfig(): EmbeddingConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Obtiene información sobre el modelo utilizado
   */
  getModelInfo() {
    return {
      name: this.defaultConfig.model,
      dimensions: this.defaultConfig.dimensions,
      maxTokens: this.getModelTokenLimit(this.defaultConfig.model),
      costPerToken: 0.00002, // Precio aproximado de text-embedding-3-small
    };
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Combina la configuración por defecto con la proporcionada
   */
  private mergeConfig(
    config?: Partial<EmbeddingConfig>,
  ): Required<EmbeddingConfig> {
    const merged = {
      ...this.defaultConfig,
      ...config,
    };

    // Validar modelo
    if (!this.getAvailableModels().includes(merged.model)) {
      throw new Error(`Modelo no soportado: ${merged.model}`);
    }

    // Validar dimensiones
    const supportedDimensions = this.getModelDimensions(merged.model);
    if (!supportedDimensions.includes(merged.dimensions)) {
      throw new Error(
        `Dimensiones ${merged.dimensions} no soportadas para modelo ${merged.model}. Soportadas: ${supportedDimensions.join(', ')}`,
      );
    }

    return merged;
  }

  /**
   * Determina si se debe incluir el parámetro dimensions
   */
  private shouldIncludeDimensions(model: string): boolean {
    // text-embedding-ada-002 no soporta el parámetro dimensions
    return (
      (model as OpenAIEmbeddingModel) !==
      OpenAIEmbeddingModel.TEXT_EMBEDDING_ADA_002
    );
  }

  /**
   * Maneja errores de OpenAI y los convierte a errores descriptivos
   */
  private handleOpenAIError(error: unknown, operation: string): Error {
    if (error instanceof OpenAI.APIError) {
      const message = `Error de API OpenAI en ${operation}: ${error.message}`;

      switch (error.status) {
        case 401:
          return new Error(`${message} - Clave API inválida o sin permisos`);
        case 429:
          return new Error(
            `${message} - Límite de rate excedido, intenta más tarde`,
          );
        case 400:
          return new Error(
            `${message} - Solicitud inválida, verifica los parámetros`,
          );
        case 500:
        case 502:
        case 503:
          return new Error(
            `${message} - Error del servidor OpenAI, intenta más tarde`,
          );
        default:
          return new Error(message);
      }
    }

    if (error instanceof OpenAI.APIConnectionError) {
      return new Error(
        `Error de conexión con OpenAI en ${operation}: ${error.message}`,
      );
    }

    if (error instanceof OpenAI.RateLimitError) {
      return new Error(
        `Límite de rate excedido en ${operation}: ${error.message}`,
      );
    }

    if (error instanceof Error) {
      return new Error(`Error en ${operation}: ${error.message}`);
    }

    return new Error(`Error desconocido en ${operation}`);
  }
}
