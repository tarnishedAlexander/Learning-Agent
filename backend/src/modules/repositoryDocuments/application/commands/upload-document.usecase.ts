import { Injectable, BadRequestException } from '@nestjs/common';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import { Document } from '../../domain/entities/document.entity';
import { UploadDocumentRequest } from '../../domain/value-objects/upload-document.vo';

@Injectable()
export class UploadDocumentUseCase {
  constructor(private readonly storageAdapter: DocumentStoragePort) {}

  async execute(file: Express.Multer.File): Promise<Document> {
    // Validar que sea un PDF
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten archivos PDF');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo no puede ser mayor a 10MB');
    }

    const uploadRequest = new UploadDocumentRequest(
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
    );
    return await this.storageAdapter.uploadDocument(uploadRequest);
  }
}
