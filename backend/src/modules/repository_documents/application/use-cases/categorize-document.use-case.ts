import { Injectable, Logger } from '@nestjs/common';
import {
  DocumentCategorizationService,
  DocumentCategorizationOptions,
  DocumentCategorizationResult,
} from '../../domain/services/document-categorization.service';

/**
 * DTO para solicitud de categorización de documento
 */
export interface CategorizeDocumentRequest {
  /** ID del documento */
  documentId: string;

  /** Si debe reemplazar categorías existentes */
  replaceExisting?: boolean;

  /** Umbral de confianza mínimo (0-1) */
  confidenceThreshold?: number;

  /** Máximo número de categorías por documento */
  maxCategoriesPerDocument?: number;
}

/**
 * DTO para respuesta de categorización de documento
 */
export interface CategorizeDocumentResponse {
  /** Indica si la operación fue exitosa */
  success: boolean;

  /** Resultado detallado */
  result?: DocumentCategorizationResult;

  /** Mensaje de error si falló */
  error?: string;

  /** Código de error */
  errorCode?: string;
}

/**
 * Caso de uso para categorizar un documento
 *
 * Coordina el proceso completo de categorización automática
 * basada en el análisis del contenido del documento
 */
@Injectable()
export class CategorizeDocumentUseCase {
  private readonly logger = new Logger(CategorizeDocumentUseCase.name);

  constructor(
    private readonly categorizationService: DocumentCategorizationService,
  ) {}

  /**
   * Ejecuta la categorización de un documento
   *
   * @param request - Solicitud con parámetros de categorización
   */
  async execute(
    request: CategorizeDocumentRequest,
  ): Promise<CategorizeDocumentResponse> {
    try {
      this.logger.log(
        `🔍 [UseCase] Ejecutando categorización para documento: ${request.documentId}`,
      );

      // 1. Validar entrada
      this.logger.log(`📋 [UseCase] Validando request...`);
      this.validateRequest(request);

      // 2. Preparar opciones
      const options: DocumentCategorizationOptions = {
        replaceExisting: request.replaceExisting ?? false,
        confidenceThreshold: request.confidenceThreshold ?? 0.3,
        maxCategoriesPerDocument: request.maxCategoriesPerDocument ?? 3,
      };

      this.logger.log(
        `🔧 [UseCase] Opciones preparadas: ${JSON.stringify(options)}`,
      );

      // 3. Ejecutar categorización
      this.logger.log(`🚀 [UseCase] Llamando al servicio de categorización...`);
      const result = await this.categorizationService.categorizeDocument(
        request.documentId,
        options,
      );

      this.logger.log(
        `📊 [UseCase] Resultado del servicio: ${JSON.stringify(result)}`,
      );

      // 4. Verificar si hubo errores
      if (result.errors && result.errors.length > 0) {
        this.logger.warn(
          `⚠️ [UseCase] Categorización completada con errores para ${request.documentId}: ${result.errors.join(', ')}`,
        );
      } else {
        this.logger.log(
          `✅ [UseCase] Categorización exitosa para ${request.documentId}. ` +
            `Categorías asignadas: ${result.assignedCategories.length}`,
        );
      }

      return {
        success: true,
        result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('❌ Error en CategorizeDocumentUseCase:', errorMessage);

      return {
        success: false,
        error: errorMessage,
        errorCode: this.categorizeError(error),
      };
    }
  }

  /**
   * Obtiene todas las categorías disponibles
   */
  async getAvailableCategories() {
    try {
      return await this.categorizationService.getAvailableCategories();
    } catch (error) {
      this.logger.error('❌ Error obteniendo categorías disponibles:', error);
      throw error;
    }
  }

  /**
   * Obtiene las categorías de un documento específico
   */
  async getDocumentCategories(documentId: string) {
    try {
      return await this.categorizationService.getDocumentCategories(documentId);
    } catch (error) {
      this.logger.error(
        `❌ Error obteniendo categorías del documento ${documentId}:`,
        error,
      );
      throw error;
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Valida la solicitud de categorización
   */
  private validateRequest(request: CategorizeDocumentRequest): void {
    // Validar documentId
    if (!request.documentId || typeof request.documentId !== 'string') {
      throw new Error(
        'El ID del documento es requerido y debe ser una cadena válida',
      );
    }

    if (request.documentId.trim().length === 0) {
      throw new Error('El ID del documento no puede estar vacío');
    }

    // Validar umbral de confianza
    if (request.confidenceThreshold !== undefined) {
      if (
        typeof request.confidenceThreshold !== 'number' ||
        request.confidenceThreshold < 0 ||
        request.confidenceThreshold > 1
      ) {
        throw new Error(
          'El umbral de confianza debe ser un número entre 0 y 1',
        );
      }
    }

    // Validar máximo de categorías
    if (request.maxCategoriesPerDocument !== undefined) {
      if (
        !Number.isInteger(request.maxCategoriesPerDocument) ||
        request.maxCategoriesPerDocument < 1 ||
        request.maxCategoriesPerDocument > 10
      ) {
        throw new Error(
          'El máximo de categorías por documento debe ser un entero entre 1 y 10',
        );
      }
    }
  }

  /**
   * Categoriza el tipo de error para mejor manejo
   */
  private categorizeError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'UNKNOWN_ERROR';
    }

    const message = error.message.toLowerCase();

    if (message.includes('documento') && message.includes('no encontr')) {
      return 'DOCUMENT_NOT_FOUND';
    }

    if (message.includes('chunks') && message.includes('no encontr')) {
      return 'NO_CHUNKS_FOUND';
    }

    if (message.includes('categoría') || message.includes('category')) {
      return 'CATEGORY_ERROR';
    }

    if (message.includes('validar') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }

    if (message.includes('base de datos') || message.includes('database')) {
      return 'DATABASE_ERROR';
    }

    if (
      message.includes('red') ||
      message.includes('network') ||
      message.includes('timeout')
    ) {
      return 'NETWORK_ERROR';
    }

    return 'PROCESSING_ERROR';
  }
}
