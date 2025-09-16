import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContextualLoggerService } from '../services/contextual-logger.service';
import { GetDocumentsBySubjectUseCase } from '../../application/queries/get-documents-by-subject.usecase';
import { GetDocumentContentUseCase } from '../../application/queries/get-document-content.usecase';
import {
  ContractDocumentListResponseDto,
  ContractDocumentItemDto,
  DocumentContentResponseDto,
  DocumentContentMetadataDto,
  GetDocumentsBySubjectQueryDto,
} from './dtos/contract-documents.dto';

/**
 * Controller for contract endpoints with the student module
 * Base URL: /api/v1/documents
 */
@Controller('api/v1/documents')
@UseGuards(AuthGuard('jwt'))
export class ContractDocumentsController {
  constructor(
    private readonly getDocumentsBySubjectUseCase: GetDocumentsBySubjectUseCase,
    private readonly getDocumentContentUseCase: GetDocumentContentUseCase,
    private readonly logger: ContextualLoggerService,
  ) {}

  @Get('subject/:subjectId/documents')
  async getDocumentsBySubject(
    @Param('subjectId') subjectId: string,
    @Query() query: GetDocumentsBySubjectQueryDto,
  ): Promise<ContractDocumentListResponseDto> {
    try {
      this.logger.logDocumentOperation('list', undefined, {
        subjectId,
        query,
      });

      if (!subjectId || !subjectId.trim()) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'ID de materia es requerido',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.getDocumentsBySubjectUseCase.execute({
        subjectId: subjectId.trim(),
        tipo: query.tipo,
        page: query.page || 1,
        limit: query.limit || 10,
      });
      // Map the domain response to contract DTOs
      const documentos = result.docs.map(
        (doc) =>
          new ContractDocumentItemDto(
            doc.id,
            doc.originalName, // titulo
            this.extractFileType(doc.mimeType), // tipo
            doc.downloadUrl, // url
            doc.uploadedAt, // fechaCarga
            doc.uploadedBy, // profesorId
          ),
      );

      this.logger.log('Documents retrieved successfully for subject', {
        subjectId,
        totalDocuments: result.total,
        documentsReturned: documentos.length,
        page: result.page,
      });

      return new ContractDocumentListResponseDto(
        documentos,
        result.total,
        result.page,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Error retrieving documents by subject',
        error instanceof Error ? error : errorMessage,
        {
          subjectId,
          errorType: 'DOCUMENTS_BY_SUBJECT_ERROR',
        },
      );

      //Handle different types of errors
      if (errorMessage.includes('no encontrado')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Materia no encontrada',
            error: 'Not Found',
            details: errorMessage,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (errorMessage.includes('Servicio de almacenamiento')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Servicio de almacenamiento no disponible',
            error: 'Service Unavailable',
            details: errorMessage,
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Generic error
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
   * GET /documentS/{docId}/content
   * Obtain the extracted content of a specific document.
   */
  @Get(':docId/content')
  async getDocumentContent(
    @Param('docId') docId: string,
  ): Promise<DocumentContentResponseDto> {
    try {
      this.logger.logDocumentOperation('download', docId);

      if (!docId || !docId.trim()) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'ID de documento es requerido',
            error: 'Bad Request',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.getDocumentContentUseCase.execute({
        docId: docId.trim(),
      });

      this.logger.log('Document content retrieved successfully', {
        docId,
        contentLength: result.contenido.length,
        hasMetadata: !!result.metadata,
      });

      return new DocumentContentResponseDto(
        result.contenido,
        new DocumentContentMetadataDto(
          result.metadata.paginas,
          result.metadata.resumen,
        ),
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Error retrieving document content',
        error instanceof Error ? error : errorMessage,
        {
          docId,
          errorType: 'DOCUMENT_CONTENT_ERROR',
        },
      );

      // handle different types of errors
      if (errorMessage.includes('no encontrado')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Documento no encontrado',
            error: 'Not Found',
            details: errorMessage,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (errorMessage.includes('no tiene contenido de texto extraído')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'El documento no tiene contenido de texto extraído',
            error: 'Bad Request',
            details: errorMessage,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Generic error
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al obtener contenido',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Extracts the file type from the mimeType to comply with the contract
   */
  private extractFileType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word')) return 'documento';
    if (mimeType.includes('text')) return 'texto';
    return 'documento';
  }
}
