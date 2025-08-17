import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentRepository } from '../../domain/ports/document.repository.port';
import { S3StorageService } from '../../infraestructure/storage/s3.storage.service';

export interface UploadResult {
  id: string;
  originalName: string;
  storedName: string;
  s3Key: string;
  size: number;
  contentType: string;
  uploadedAt: Date;
  url?: string;
}

@Injectable()
export class UploadDocumentUseCase {
  constructor(
    private readonly storage: S3StorageService,
    private readonly repository: DocumentRepository,
  ) {}

  async execute(
    fileBuffer: Buffer,
    originalName: string,
    size: number,
    contentType: string,
  ): Promise<UploadResult> {
    const timestamp = Date.now();
    const storedName = `${timestamp}-${uuidv4()}-${originalName.replace(/\s+/g, '_')}`;
    const s3Key = storedName;
    await this.storage.upload(fileBuffer, s3Key, contentType);

    const uploadedAt = new Date();

    // persist metadata
    const saved = await this.repository.save({
      originalName,
      storedName,
      s3Key,
      size,
      contentType,
      uploadedAt,
    });

    const url = this.storage.getPublicUrl(s3Key);

    return {
      id: saved.id,
      originalName: saved.originalName,
      storedName: saved.storedName,
      s3Key: saved.s3Key,
      size: saved.size,
      contentType: saved.contentType,
      uploadedAt: saved.uploadedAt,
      url,
    };
  }
}
