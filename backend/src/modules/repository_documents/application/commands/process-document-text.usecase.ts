import { Injectable, Logger } from '@nestjs/common';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import type { TextExtractionPort } from '../../domain/ports/text-extraction.port';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import { DocumentStatus } from '../../domain/entities/document.entity';

@Injectable()
export class ProcessDocumentTextUseCase {
  private readonly logger = new Logger(ProcessDocumentTextUseCase.name);

  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly textExtraction: TextExtractionPort,
    private readonly storageAdapter: DocumentStoragePort,
  ) {}

  /**
   * Procesa un documento para extraer su texto
   * @param documentId ID del documento a procesar
   * @returns true si se procesó exitosamente
   */
  async execute(documentId: string): Promise<boolean> {
    try {
      this.logger.log(`Iniciando procesamiento de documento: ${documentId}`);

      // 1. Buscar el documento
      const document = await this.documentRepository.findById(documentId);
      if (!document) {
        this.logger.error(`Documento no encontrado: ${documentId}`);
        return false;
      }

      // 2. Verificar que esté en estado UPLOADED
      if (!document.isReadyForProcessing()) {
        this.logger.warn(
          `Documento ${documentId} no está listo para procesamiento. Estado: ${document.status}`,
        );
        return false;
      }

      // 3. Marcar como PROCESSING
      await this.documentRepository.updateStatus(
        documentId,
        DocumentStatus.PROCESSING,
      );

      try {
        // 4. Descargar archivo de S3
        const fileBuffer = await this.downloadFileFromStorage(document.s3Key);

        // 5. Extraer texto del PDF
        const extractedText = await this.textExtraction.extractTextFromPdf(
          fileBuffer,
          document.originalName,
        );

        // 6. Actualizar documento con texto extraído
        await this.documentRepository.updateExtractedText(
          documentId,
          extractedText.content,
          extractedText.pageCount,
          extractedText.documentTitle,
          extractedText.documentAuthor,
          extractedText.language,
        );

        // 7. Marcar como PROCESSED
        await this.documentRepository.updateStatus(
          documentId,
          DocumentStatus.PROCESSED,
        );

        this.logger.log(
          `Documento ${documentId} procesado exitosamente. ` +
            `Texto extraído: ${extractedText.getContentLength()} caracteres, ` +
            `${extractedText.getWordCount()} palabras`,
        );

        return true;
      } catch (error) {
        // En caso de error, marcar documento como ERROR
        await this.documentRepository.updateStatus(
          documentId,
          DocumentStatus.ERROR,
        );

        this.logger.error(`Error procesando documento ${documentId}`);
        throw error;
      }
    } catch {
      this.logger.error(`Error en procesamiento de documento ${documentId}`);
      return false;
    }
  }



  
  /**
   * Descarga un archivo desde el storage (S3/MinIO)
   */
  private async downloadFileFromStorage(s3Key: string): Promise<Buffer> {
    try {
      return await this.storageAdapter.downloadFileBuffer(s3Key);
    } catch {
      throw new Error('Failed to download file from storage');
    }
  }
}
