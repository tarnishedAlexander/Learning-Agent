import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import {
  CategorizeDocumentUseCase,
  CategorizeDocumentRequest,
} from '../../application/use-cases/categorize-document.use-case';

/**
 * DTO para categorización de documento
 */
export class CategorizeDocumentDto {
  /** Si debe reemplazar categorías existentes */
  replaceExisting?: boolean = false;

  /** Umbral de confianza mínimo (0-1) */
  confidenceThreshold?: number = 0.3;

  /** Máximo número de categorías por documento */
  maxCategoriesPerDocument?: number = 3;
}

/**
 * Controlador para funcionalidades de categorización de documentos
 *
 * Maneja las operaciones de categorización automática basada en contenido
 */
@ApiTags('Repository Documents - Categorization')
@Controller('api/repository-documents/categorization')
export class CategorizationController {
  private readonly logger = new Logger(CategorizationController.name);

  constructor(
    private readonly categorizeDocumentUseCase: CategorizeDocumentUseCase,
  ) {}

  /**
   * Categoriza automáticamente un documento
   */
  @Post('categorize/:documentId')
  @ApiOperation({
    summary: 'Categorizar un documento automáticamente',
    description:
      'Analiza el contenido de un documento y asigna categorías automáticamente basándose en palabras clave y patrones',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID único del documento a categorizar',
    example: 'doc-123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: CategorizeDocumentDto,
    description: 'Opciones de categorización',
    examples: {
      basic: {
        summary: 'Categorización básica',
        value: {
          replaceExisting: false,
          confidenceThreshold: 0.3,
          maxCategoriesPerDocument: 3,
        },
      },
      strict: {
        summary: 'Categorización estricta',
        value: {
          replaceExisting: true,
          confidenceThreshold: 0.6,
          maxCategoriesPerDocument: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Categorización exitosa',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        result: {
          type: 'object',
          properties: {
            documentId: { type: 'string' },
            assignedCategories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                      color: { type: 'string' },
                      icon: { type: 'string' },
                    },
                  },
                  confidence: { type: 'number' },
                  reason: { type: 'string' },
                },
              },
            },
            processingTimeMs: { type: 'number' },
          },
        },
        metadata: {
          type: 'object',
          properties: {
            processingTimeMs: { type: 'number' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación o parámetros inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento no encontrado',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async categorizeDocument(
    @Param('documentId') documentId: string,
    @Body() dto: CategorizeDocumentDto = {},
  ): Promise<{
    success: boolean;
    result?: any;
    metadata?: any;
    error?: string;
    errorCode?: string;
  }> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Iniciando categorización para documento: ${documentId} con opciones: ${JSON.stringify(dto)}`,
      );

      // Preparar request
      const request: CategorizeDocumentRequest = {
        documentId,
        replaceExisting: dto.replaceExisting ?? false,
        confidenceThreshold: dto.confidenceThreshold ?? 0.3,
        maxCategoriesPerDocument: dto.maxCategoriesPerDocument ?? 3,
      };

      this.logger.log(`Request preparado: ${JSON.stringify(request)}`);

      // Ejecutar categorización
      this.logger.log(`Ejecutando caso de uso de categorización...`);
      const result = await this.categorizeDocumentUseCase.execute(request);

      this.logger.log(`📊 Resultado obtenido: ${JSON.stringify(result)}`);

      const processingTime = Date.now() - startTime;

      if (!result.success) {
        this.logger.error(`Error en categorización: ${result.error}`);
        throw new HttpException(
          {
            statusCode: this.getHttpStatusFromErrorCode(
              result.errorCode || 'PROCESSING_ERROR',
            ),
            message: 'Error en la categorización del documento',
            error: result.error,
            errorCode: result.errorCode,
            documentId,
          },
          this.getHttpStatusFromErrorCode(
            result.errorCode || 'PROCESSING_ERROR',
          ),
        );
      }

      this.logger.log(
        `✅ Categorización exitosa para ${documentId} en ${processingTime}ms. ` +
          `Categorías asignadas: ${result.result?.assignedCategories?.length || 0}`,
      );

      return {
        success: true,
        result: result.result,
        metadata: {
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error categorizando documento ${documentId}:`,
        errorMessage,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno durante la categorización',
          error: errorMessage,
          documentId,
          processingTimeMs: processingTime,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene todas las categorías disponibles
   */
  @Get('categories')
  @ApiOperation({
    summary: 'Obtener todas las categorías disponibles',
    description: 'Lista todas las categorías predefinidas en el sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              color: { type: 'string' },
              icon: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  async getAvailableCategories() {
    try {
      const categories =
        await this.categorizeDocumentUseCase.getAvailableCategories();

      return {
        success: true,
        categories: categories.map((cat) => cat.toJSON()),
        total: categories.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        'Error obteniendo categorías disponibles:',
        errorMessage,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error obteniendo categorías disponibles',
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene las categorías asignadas a un documento específico
   */
  @Get('document/:documentId/categories')
  @ApiOperation({
    summary: 'Obtener categorías de un documento',
    description:
      'Lista todas las categorías asignadas a un documento específico',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID único del documento',
  })
  @ApiResponse({
    status: 200,
    description: 'Categorías del documento',
  })
  @ApiResponse({
    status: 404,
    description: 'Documento no encontrado',
  })
  async getDocumentCategories(@Param('documentId') documentId: string) {
    try {
      const categories =
        await this.categorizeDocumentUseCase.getDocumentCategories(documentId);

      return {
        success: true,
        documentId,
        categories: categories.map((cat) => cat.toJSON()),
        total: categories.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error obteniendo categorías del documento ${documentId}:`,
        errorMessage,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error obteniendo categorías del documento',
          error: errorMessage,
          documentId,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Mapea códigos de error a códigos de estado HTTP
   */
  private getHttpStatusFromErrorCode(errorCode: string): HttpStatus {
    switch (errorCode) {
      case 'DOCUMENT_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'NO_CHUNKS_FOUND':
        return HttpStatus.BAD_REQUEST;
      case 'VALIDATION_ERROR':
        return HttpStatus.BAD_REQUEST;
      case 'CATEGORY_ERROR':
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case 'DATABASE_ERROR':
        return HttpStatus.SERVICE_UNAVAILABLE;
      case 'NETWORK_ERROR':
        return HttpStatus.SERVICE_UNAVAILABLE;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
