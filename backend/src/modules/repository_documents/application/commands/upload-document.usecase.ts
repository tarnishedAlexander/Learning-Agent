import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import { Document } from '../../domain/entities/document.entity';
import { UploadDocumentRequest } from '../../domain/value-objects/upload-document.vo';

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    private readonly storageAdapter: DocumentStoragePort,
    private readonly documentRepository: DocumentRepositoryPort,
  ) {}

  async execute(
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<Document> {
    // Validar que sea un PDF
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten archivos PDF');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo no puede ser mayor a 10MB');
    }

    // Generar hash SHA-256 del archivo
    const fileHash = this.generateFileHash(file.buffer);

    // Verificar si ya existe un archivo con el mismo hash
    const existingDocument =
      await this.documentRepository.findByFileHash(fileHash);
    if (existingDocument) {
      throw new BadRequestException('Este archivo ya existe en el sistema');
    }

    // Generar ID único para el documento
    const documentId = uuidv4();

    // Subir archivo a storage
    const uploadRequest = new UploadDocumentRequest(
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
    );

    const storageResult =
      await this.storageAdapter.uploadDocument(uploadRequest);

    // Crear entidad de documento para base de datos
    const document = Document.create(
      documentId,
      storageResult.fileName, // storedName
      file.originalname, // originalName
      file.mimetype,
      file.size,
      storageResult.url,
      storageResult.fileName, // s3Key (mismo que fileName en este caso)
      fileHash,
      uploadedBy,
    );

    // Guardar en base de datos
    const savedDocument = await this.documentRepository.save(document);

    return savedDocument;
  }

  /**
   * Genera hash SHA-256 del archivo
   */
  private generateFileHash(fileBuffer: Buffer): string {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }
}