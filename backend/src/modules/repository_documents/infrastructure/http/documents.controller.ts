import { createHash } from 'crypto';
import {
  Controller,
  Get,
  Delete,
  Post,
  Param,
  // Query,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import type { AuthenticatedRequest } from '../http/middleware/auth.middleware';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ContextualLoggerService } from '../services/contextual-logger.service';
import { ListDocumentsUseCase } from '../../application/queries/list-documents.usecase';
import { DeleteDocumentUseCase } from '../../application/commands/delete-document.usecase';
import { UploadDocumentUseCase } from '../../application/commands/upload-document.usecase';
import { ProcessDocumentTextUseCase } from '../../application/commands/process-document-text.usecase';
import { ProcessDocumentChunksUseCase } from '../../application/commands/process-document-chunks.usecase';
import { CheckDocumentSimilarityUseCase } from '../../application/use-cases/check-document-similarity.usecase';
import {
  DocumentListResponseDto,
  DocumentListItemDto,
} from './dtos/list-documents.dto';
import {
  DeleteDocumentResponseDto,
  DeleteDocumentErrorDto,
} from './dtos/delete-document.dto';
import type { UploadDocumentResponseDto } from '../http/dtos/upload-document.dto';
import {
  CheckDocumentSimilarityResponseDto,
  ExistingDocumentDto,
  SimilarDocumentDto,
  CheckDocumentSimilarityRequestDto,
  UploadWithConfirmationResponseDto,
  ConfirmUploadRequestDto,
} from './dtos/check-document-similarity.dto';
import { DownloadDocumentUseCase } from '../../application/commands/download-document.usecase';
import { CheckDocumentSimilarityRequest } from '../../domain/value-objects/document-similarity-check.vo';

@Controller('api/documents')
export class DocumentsController {
  constructor(
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly uploadDocumentUseCase: UploadDocumentUseCase,
    private readonly downloadDocumentUseCase: DownloadDocumentUseCase,
    private readonly processDocumentTextUseCase: ProcessDocumentTextUseCase,
    private readonly processDocumentChunksUseCase: ProcessDocumentChunksUseCase,
    private readonly checkDocumentSimilarityUseCase: CheckDocumentSimilarityUseCase,

    private readonly logger: ContextualLoggerService,
  ) {}

  @Get()
  async listDocuments(): Promise<DocumentListResponseDto> {
    try {
      this.logger.logDocumentOperation('list');

      const result = await this.listDocumentsUseCase.execute();

      // Mapear la respuesta del dominio a DTOs
      const documents = result.docs.map(
        (doc) =>
          new DocumentListItemDto(
            doc.id,
            doc.fileName,
            doc.originalName,
            doc.mimeType,
            doc.size,
            doc.downloadUrl,
            doc.uploadedAt,
          ),
      );

      this.logger.log('Documents retrieved successfully', {
        totalDocuments: result.total,
        documentsReturned: documents.length,
      });

      return new DocumentListResponseDto(
        documents,
        result.total,
        'Documentos recuperados exitosamente',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Error retrieving documents',
        error instanceof Error ? error : errorMessage,
        {
          errorType: 'DOCUMENTS_LIST_ERROR',
        },
      );

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

  @Delete(':id')
  async deleteDocument(
    @Param('id') documentId: string,
  ): Promise<DeleteDocumentResponseDto> {
    try {
      this.logger.logDocumentOperation('delete', documentId);

      const result = await this.deleteDocumentUseCase.execute(documentId);

      if (!result.success) {
        // Documento no encontrado
        if (result.error === 'DOCUMENT_NOT_FOUND') {
          this.logger.warn('Document not found for deletion', {
            documentId,
            errorType: 'DOCUMENT_NOT_FOUND',
          });

          throw new HttpException(
            new DeleteDocumentErrorDto(
              'Document Not Found',
              result.message,
              documentId,
            ),
            HttpStatus.NOT_FOUND,
          );
        }

        // Otros errores
        this.logger.error('Document deletion failed', result.message, {
          documentId,
          errorType: result.error,
        });

        throw new HttpException(
          new DeleteDocumentErrorDto(
            'Delete Failed',
            result.message,
            documentId,
          ),
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log('Document deleted successfully', {
        documentId,
        deletedAt: result.deletedAt,
      });

      return new DeleteDocumentResponseDto(
        result.message,
        documentId,
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

      this.logger.error(
        'Unexpected error in deleteDocument',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          errorType: 'UNEXPECTED_ERROR',
        },
      );

      throw new HttpException(
        new DeleteDocumentErrorDto(
          'Internal Server Error',
          `Error interno del servidor al eliminar documento: ${errorMessage}`,
          documentId,
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('check-similarity')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB en bytes
      },
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          callback(
            new BadRequestException('Solo se permiten archivos PDF'),
            false,
          );
        } else {
          callback(null, true);
        }
      },
    }),
  )
  async checkDocumentSimilarity(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: CheckDocumentSimilarityRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CheckDocumentSimilarityResponseDto> {
    try {
      if (!file) {
        throw new BadRequestException('No se ha proporcionado ningún archivo');
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('Usuario no autenticado');
      }

      this.logger.setContext({ userId });
      this.logger.logDocumentOperation('upload', undefined, {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      const request = new CheckDocumentSimilarityRequest(
        file.buffer,
        file.originalname,
        file.mimetype,
        userId,
        {
          skipEmbeddings: options.skipEmbeddings,
          similarityThreshold: options.similarityThreshold,
          maxCandidates: options.maxCandidates,
          useSampling: options.useSampling,
        },
      );

      const result = await this.checkDocumentSimilarityUseCase.execute(request);

      // mapear resultado del dominio a dto
      let existingDocumentDto: ExistingDocumentDto | undefined;
      if (result.existingDocument) {
        existingDocumentDto = new ExistingDocumentDto(
          result.existingDocument.id,
          result.existingDocument.originalName,
          result.existingDocument.documentTitle || null,
          result.existingDocument.documentAuthor || null,
          result.existingDocument.uploadedAt,
          result.existingDocument.uploadedBy,
          result.existingDocument.matchType,
        );
      }

      const similarCandidatesDto: SimilarDocumentDto[] =
        result.similarCandidates?.map(
          (candidate) =>
            new SimilarDocumentDto(
              candidate.id,
              candidate.originalName,
              candidate.documentTitle || null,
              candidate.documentAuthor || null,
              candidate.uploadedAt,
              candidate.uploadedBy,
              candidate.similarityScore,
              {
                avgSimilarity: candidate.avgSimilarity,
                coverage: candidate.coverage,
                matchedChunks: candidate.matchedChunks,
                totalChunks: candidate.totalChunks,
              },
            ),
        ) || [];

      const message = this.getSimilarityMessage(
        result.status,
        result.similarCandidates?.length || 0,
      );

      this.logger.log('Document similarity check completed', {
        fileName: file.originalname,
        status: result.status,
        candidatesFound: similarCandidatesDto.length,
      });

      return new CheckDocumentSimilarityResponseDto(
        result.status,
        message,
        existingDocumentDto,
        similarCandidatesDto,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in checkDocumentSimilarity',
        error instanceof Error ? error : errorMessage,
        {
          fileName: file?.originalname,
          errorType: 'UNEXPECTED_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            'Error interno del servidor durante la verificación de similitud',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getSimilarityMessage(
    status: string,
    candidatesCount: number,
  ): string {
    switch (status) {
      case 'exact_match':
        return 'Se encontró un documento idéntico en el sistema';
      case 'text_match':
        return 'Se encontró un documento con contenido textual idéntico';
      case 'candidates':
        return `Se encontraron ${candidatesCount} documento(s) similar(es)`;
      case 'no_match':
        return 'No se encontraron documentos similares';
      default:
        return 'Verificación completada';
    }
  }

  @Post('upload-with-check')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB en bytes
      },
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          callback(
            new BadRequestException('Solo se permiten archivos PDF'),
            false,
          );
        } else {
          callback(null, true);
        }
      },
    }),
  )
  async uploadDocumentWithCheck(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: CheckDocumentSimilarityRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadDocumentResponseDto | UploadWithConfirmationResponseDto> {
    try {
      if (!file) {
        throw new BadRequestException('No se ha proporcionado ningún archivo');
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('Usuario no autenticado');
      }

      this.logger.setContext({ userId });
      this.logger.logDocumentOperation('upload', undefined, {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      // primero verificar similitud
      const checkRequest = new CheckDocumentSimilarityRequest(
        file.buffer,
        file.originalname,
        file.mimetype,
        userId,
        {
          skipEmbeddings: options.skipEmbeddings,
          similarityThreshold: options.similarityThreshold || 0.8,
          maxCandidates: options.maxCandidates || 10,
          useSampling: options.useSampling ?? true,
        },
      );

      const similarityResult =
        await this.checkDocumentSimilarityUseCase.execute(checkRequest);

      // si hay coincidencia exacta, rechazar subida
      if (similarityResult.status === 'exact_match') {
        throw new BadRequestException(
          'Este archivo ya existe exactamente en el sistema',
        );
      }

      // si se encontraron candidatos similares, devolver confirmación
      if (
        similarityResult.status === 'candidates' &&
        similarityResult.similarCandidates &&
        similarityResult.similarCandidates.length > 0
      ) {
        const candidatesDto = similarityResult.similarCandidates.map(
          (candidate) =>
            new SimilarDocumentDto(
              candidate.id,
              candidate.originalName,
              candidate.documentTitle || null,
              candidate.documentAuthor || null,
              candidate.uploadedAt,
              candidate.uploadedBy,
              candidate.similarityScore,
              {
                avgSimilarity: candidate.avgSimilarity,
                coverage: candidate.coverage,
                matchedChunks: candidate.matchedChunks,
                totalChunks: candidate.totalChunks,
              },
            ),
        );

        // almacenar archivo temporalmente (implementar almacenamiento temporal si se desea)
        const fileHash = createHash('sha256').update(file.buffer).digest('hex');

        return new UploadWithConfirmationResponseDto(
          'confirm_required',
          `Se encontraron ${candidatesDto.length} documento(s) similar(es). ¿Desea continuar con la subida?`,
          fileHash,
          candidatesDto,
          {
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
          },
        );
      }

      // sin conflictos, proceder con la subida
      const document = await this.uploadDocumentUseCase.execute(file, userId);

      this.logger.log('Document uploaded successfully', {
        documentId: document.id,
        fileName: document.fileName,
        originalName: document.originalName,
        size: document.size,
      });

      return {
        id: document.id,
        fileName: document.fileName,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        downloadUrl: document.url,
        uploadedAt: document.uploadedAt,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in uploadDocumentWithCheck',
        error instanceof Error ? error : errorMessage,
        {
          fileName: file?.originalname,
          errorType: 'UNEXPECTED_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor durante la subida del documento',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('confirm-upload')
  confirmUpload(
    @Body() request: ConfirmUploadRequestDto,
    @Req() req: AuthenticatedRequest,
  ): UploadDocumentResponseDto | { message: string } {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('Usuario no autenticado');
      }

      if (request.userId !== userId) {
        throw new BadRequestException('Usuario no autorizado');
      }

      if (!request.forceSave) {
        return { message: 'Upload cancelado por el usuario' };
      }

      // aquí debería recuperarse el archivo almacenado temporalmente
      // por ahora, devolvemos un mensaje indicando la limitación
      // en una implementación completa, se almacenaría y recuperaría el archivo aquí

      throw new BadRequestException(
        'La confirmación de subida requiere almacenamiento temporal del archivo. Use el endpoint upload-with-check para verificar similitud.',
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in confirmUpload',
        error instanceof Error ? error : errorMessage,
        {
          fileHash: request.fileHash,
          errorType: 'UNEXPECTED_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor durante la confirmación',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB en bytes
      },
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          callback(
            new BadRequestException('Solo se permiten archivos PDF'),
            false,
          );
        } else {
          callback(null, true);
        }
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { skipValidation?: string; forceUpload?: string },
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadDocumentResponseDto> {
    try {
      console.log(' Upload request received:', {
        hasFile: !!file,
        fileInfo: file
          ? {
              originalname: file.originalname,
              size: file.size,
              mimetype: file.mimetype,
              fieldname: file.fieldname,
            }
          : null,
        hasUser: !!req.user,
        userId: req.user?.id,
        headers: req.headers,
        skipValidation: body?.skipValidation,
        forceUpload: body?.forceUpload,
      });

      if (!file) {
        throw new BadRequestException('No se ha proporcionado ningún archivo');
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestException('Usuario no autenticado');
      }

      // validación de similitud automática (a menos que se omita)
      const shouldSkipValidation =
        body?.skipValidation === 'true' || body?.forceUpload === 'true';

      if (!shouldSkipValidation) {
        this.logger.log('Running similarity check before upload', {
          fileName: file.originalname,
          fileSize: file.size,
        });

        const similarityRequest = new CheckDocumentSimilarityRequest(
          file.buffer,
          file.originalname,
          file.mimetype,
          userId,
          {
            similarityThreshold: 0.95,
            maxCandidates: 5,
            skipEmbeddings: false,
            useSampling: true,
          },
        );

        const similarityResult =
          await this.checkDocumentSimilarityUseCase.execute(similarityRequest);

        // si hay duplicados exactos o de contenido, rechazar subida
        if (
          similarityResult.status === 'exact_match' ||
          similarityResult.status === 'text_hash_match'
        ) {
          this.logger.warn('Upload blocked due to exact duplicate found', {
            fileName: file.originalname,
            status: similarityResult.status,
            existingDocumentId: similarityResult.existingDocument?.id,
          });

          throw new HttpException(
            {
              statusCode: HttpStatus.CONFLICT,
              message:
                similarityResult.status === 'exact_match'
                  ? 'Este archivo ya existe en el sistema'
                  : 'Ya existe un documento con el mismo contenido',
              error: 'Document Duplicate',
              details: {
                status: similarityResult.status,
                existingDocument: similarityResult.existingDocument,
              },
            },
            HttpStatus.CONFLICT,
          );
        }

        // si hay candidatos similares, informar pero permitir subida
        if (
          similarityResult.status === 'candidates' &&
          similarityResult.similarCandidates &&
          similarityResult.similarCandidates.length > 0
        ) {
          this.logger.warn('Similar documents found but allowing upload', {
            fileName: file.originalname,
            candidatesCount: similarityResult.similarCandidates.length,
          });

          // opcional: podrías rechazar aquí según la lógica de negocio
          // por ahora, solo registramos y continuamos
        }
      }

      this.logger.setContext({ userId });
      this.logger.logDocumentOperation('upload', undefined, {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      const document = await this.uploadDocumentUseCase.execute(file, userId);

      this.logger.log('Document uploaded successfully', {
        documentId: document.id,
        fileName: document.fileName,
        originalName: document.originalName,
        size: document.size,
      });

      return {
        id: document.id,
        fileName: document.fileName,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        downloadUrl: document.url,
        uploadedAt: document.uploadedAt,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      // error inesperado
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in uploadDocument',
        error instanceof Error ? error : errorMessage,
        {
          fileName: file?.originalname,
          fileSize: file?.size,
          errorType: 'UPLOAD_ERROR',
        },
      );

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

  @Get('download/:id')
  async downloadDocument(
    @Param('id') documentId: string,
  ): Promise<{ downloadUrl: string }> {
    try {
      if (!documentId) {
        throw new BadRequestException(
          'No se ha proporcionado el ID del documento',
        );
      }

      this.logger.logDocumentOperation('download', documentId);

      const downloadUrl =
        await this.downloadDocumentUseCase.execute(documentId);

      this.logger.log('Document download URL generated successfully', {
        documentId,
        downloadUrlLength: downloadUrl.length,
      });

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

      this.logger.error(
        'Unexpected error in downloadDocument',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          errorType: 'DOWNLOAD_ERROR',
        },
      );

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

  @Post(':documentId/process-text')
  async processDocumentText(
    @Param('documentId') documentId: string,
  ): Promise<{ message: string; success: boolean }> {
    try {
      this.logger.logDocumentOperation('process', documentId, {
        operation: 'text_extraction',
      });

      const success = await this.processDocumentTextUseCase.execute(documentId);

      if (success) {
        this.logger.log('Document text processed successfully', {
          documentId,
          operation: 'text_extraction',
        });

        return {
          success: true,
          message: 'Texto extraído exitosamente del documento',
        };
      } else {
        this.logger.warn('Document text processing failed', {
          documentId,
          operation: 'text_extraction',
        });

        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'No se pudo procesar el documento',
            error: 'Processing Failed',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in processDocumentText',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          operation: 'text_extraction',
          errorType: 'PROCESSING_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al procesar documento',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Procesa chunks de un documento específico
   */
  @Post(':documentId/process-chunks')
  async processDocumentChunks(
    @Param('documentId') documentId: string,
    @Body()
    body: {
      chunkingConfig?: {
        maxChunkSize?: number;
        overlap?: number;
        respectParagraphs?: boolean;
        respectSentences?: boolean;
        minChunkSize?: number;
      };
      replaceExisting?: boolean;
      chunkType?: string;
    } = {},
  ) {
    try {
      if (!documentId) {
        throw new BadRequestException('ID de documento requerido');
      }

      this.logger.logChunkOperation('process', documentId, undefined, {
        chunkingConfig: body.chunkingConfig,
        replaceExisting: body.replaceExisting,
        chunkType: body.chunkType,
      });

      const result = await this.processDocumentChunksUseCase.execute({
        documentId,
        chunkingConfig: body.chunkingConfig,
        replaceExisting: body.replaceExisting,
        chunkType: body.chunkType,
      });

      if (result.status === 'success') {
        this.logger.logChunkOperation(
          'process',
          documentId,
          result.savedChunks.length,
          {
            processingTimeMs: result.processingTimeMs,
            statistics: result.chunkingResult.statistics,
          },
        );

        return {
          success: true,
          message: 'Chunks procesados exitosamente',
          data: {
            totalChunks: result.savedChunks.length,
            processingTimeMs: result.processingTimeMs,
            statistics: result.chunkingResult.statistics,
          },
        };
      } else {
        this.logger.error(
          'Chunk processing failed',
          JSON.stringify(result.errors),
          {
            documentId,
            operation: 'chunk_processing',
            errors: result.errors,
          },
        );

        return {
          success: false,
          message: 'Error procesando chunks',
          errors: result.errors,
        };
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in processDocumentChunks',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          operation: 'chunk_processing',
          errorType: 'CHUNK_PROCESSING_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al procesar chunks',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene los chunks de un documento
   */
  @Get(':documentId/chunks')
  async getDocumentChunks(
    @Param('documentId') documentId: string,
    // @query('limit') limit?: number,
    // @query('offset') offset?: number,
  ) {
    try {
      if (!documentId) {
        throw new BadRequestException('ID de documento requerido');
      }

      this.logger.logChunkOperation('retrieve', documentId);

      // usar el servicio de chunking para obtener chunks con estadísticas
      const result =
        await this.processDocumentChunksUseCase[
          'chunkingService'
        ].getDocumentChunks(documentId);

      this.logger.log('Document chunks retrieved successfully', {
        documentId,
        totalChunks: result.total,
        chunksReturned: result.chunks.length,
        statistics: result.statistics,
      });

      return {
        success: true,
        message: 'Chunks recuperados exitosamente',
        data: {
          chunks: result.chunks.map((chunk) => ({
            id: chunk.id,
            content:
              chunk.content.substring(0, 200) +
              (chunk.content.length > 200 ? '...' : ''), // vista previa
            chunkIndex: chunk.chunkIndex,
            type: chunk.type, // usar 'type' no 'chunkType'
            contentLength: chunk.content.length,
            metadata: chunk.metadata,
            createdAt: chunk.createdAt,
          })),
          total: result.total,
          statistics: result.statistics,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        'Unexpected error in getDocumentChunks',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          operation: 'chunk_retrieval',
          errorType: 'CHUNK_RETRIEVAL_ERROR',
        },
      );

      this.logger.error(
        'Unexpected error in getDocumentChunks',
        error instanceof Error ? error : errorMessage,
        {
          documentId,
          operation: 'chunk_retrieval',
          errorType: 'CHUNK_RETRIEVAL_ERROR',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno del servidor al obtener chunks',
          error: 'Internal Server Error',
          details: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
