import {
  Controller,
  Get,
  Delete,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ListDocumentsUseCase } from '../../application/queries/list-documents.usecase';
import { DeleteDocumentUseCase } from '../../application/commands/delete-document.usecase';
import {
  DocumentListResponseDto,
  DocumentListItemDto,
} from './dtos/list-documents.dto';
import {
  DeleteDocumentParamDto,
  DeleteDocumentResponseDto,
  DeleteDocumentErrorDto,
} from './dtos/delete-document.dto';

/**
 * Documents Controller
 *
 * Controlador para manejar las operaciones HTTP relacionadas con documentos.
 * Este controlador manejará:
 * - Subida de documentos
 * - Descarga de documentos
 * - Listado de documentos
 * - Eliminación de documentos
 */
@Controller('api/documents')
export class DocumentsController {
  constructor(
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
  ) {}

  /**
   * Endpoint GET /api/documents
   * Lista todos los documentos PDF almacenados en MinIO, excluyendo archivos eliminados
   *
   * @returns Lista de documentos con metadatos (nombre original, tamaño, fecha de subida, URL)
   * @throws HttpException en caso de errores de conexión o bucket vacío
   */
  @Get()
  async listDocuments(): Promise<DocumentListResponseDto> {
    try {
      const result = await this.listDocumentsUseCase.execute();

      // Mapear la respuesta del dominio a DTOs
      const documents = result.docs.map(
        (doc) =>
          new DocumentListItemDto(
            doc.fileName,
            doc.originalName,
            doc.mimeType,
            doc.size,
            doc.downloadUrl,
            doc.uploadedAt,
          ),
      );

      return new DocumentListResponseDto(
        documents,
        result.total,
        'Documentos recuperados exitosamente',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Manejar diferentes tipos de errores
      if (errorMessage.includes('Bucket de documentos no encontrado')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Servicio de almacenamiento no disponible',
            error: 'Bucket Configuration Error',
            details: errorMessage,
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (errorMessage.includes('Error de conexión con MinIO')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Servicio de almacenamiento temporalmente no disponible',
            error: 'Storage Connection Error',
            details: errorMessage,
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Error genérico
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al obtener documentos',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Endpoint DELETE /api/documents/:filename
   * Elimina un documento específico moviéndolo a la carpeta deleted/ (soft delete)
   *
   * @param params - Parámetros de la URL conteniendo el filename
   * @returns Confirmación de eliminación con metadata
   * @throws HttpException en caso de documento no encontrado o errores de eliminación
   */
  @Delete(':filename')
  async deleteDocument(
    @Param() params: DeleteDocumentParamDto,
  ): Promise<DeleteDocumentResponseDto> {
    try {
      const result = await this.deleteDocumentUseCase.execute(params.filename);

      if (!result.success) {
        // Documento no encontrado
        if (result.error === 'DOCUMENT_NOT_FOUND') {
          throw new HttpException(
            new DeleteDocumentErrorDto(
              'Document Not Found',
              result.message,
              params.filename,
            ),
            HttpStatus.NOT_FOUND,
          );
        }

        // Otros errores
        throw new HttpException(
          new DeleteDocumentErrorDto(
            'Delete Failed',
            result.message,
            params.filename,
          ),
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return new DeleteDocumentResponseDto(
        result.message,
        params.filename,
        result.deletedAt!,
      );
    } catch (error) {
      // Si ya es una HttpException, re-lanzarla
      if (error instanceof HttpException) {
        throw error;
      }

      // Error inesperado
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Unexpected error in deleteDocument:', errorMessage);

      throw new HttpException(
        new DeleteDocumentErrorDto(
          'Internal Server Error',
          `Error interno del servidor al eliminar documento: ${errorMessage}`,
          params.filename,
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
