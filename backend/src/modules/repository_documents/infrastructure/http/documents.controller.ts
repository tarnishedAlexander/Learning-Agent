import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ListDocumentsUseCase } from '../../application/queries/list-documents.usecase';
import { DeleteDocumentUseCase } from '../../application/commands/delete-document.usecase';
import { UploadDocumentUseCase } from '../../application/commands/upload-document.usecase';
import {
  DocumentListResponseDto,
  DocumentListItemDto,
} from './dtos/list-documents.dto';
import {
  DeleteDocumentParamDto,
  DeleteDocumentResponseDto,
  DeleteDocumentErrorDto,
} from './dtos/delete-document.dto';
import type { UploadDocumentResponseDto } from './dtos/upload-document.dto';
import { DownloadDocumentUseCase } from '../../application/commands/download-document.usecase';

@Controller('api/documents')
export class DocumentsController {
  constructor(
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly downloadDocumentUseCase: DownloadDocumentUseCase,
  ) {}

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
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadDocumentResponseDto> {
    try {
      if (!file) {
        throw new BadRequestException('No se ha proporcionado ningún archivo');
      }

      const document = await this.uploadDocumentUseCase.execute(file);

      return {
        fileName: document.fileName,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        downloadUrl: document.url,
        uploadedAt: document.uploadedAt,
      };
    } catch (error) {
      // Si ya es una BadRequestException o HttpException, re-lanzarla
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      // Error inesperado
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Unexpected error in uploadDocument:', errorMessage);

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al subir archivo',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('download/:filename')
  async downloadDocument(
    @Param('filename') filename: string,
  ): Promise<{ downloadUrl: string }> {
    try {
      if (!filename) {
        throw new BadRequestException(
          'No se ha proporcionado el nombre de archivo',
        );
      }

      const downloadUrl = await this.downloadDocumentUseCase.execute(filename);
      return { downloadUrl };
    } catch (error) {
      if (
        error instanceof HttpException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Unexpected error in downloadDocument:', errorMessage);

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al generar URL de descarga',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
