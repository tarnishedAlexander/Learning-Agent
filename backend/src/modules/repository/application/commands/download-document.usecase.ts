/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Readable } from 'stream';
import { Inject, Injectable } from '@nestjs/common';
import type { DocumentRepository } from '../../domain/ports/document.repository.port';
import { S3StorageService } from '../../infraestructure/storage/S3.storage.service';

@Injectable()
export class DownloadFileUseCase {
  constructor(
    private readonly storage: S3StorageService,
    @Inject('DocumentRepository')
    private readonly repository: DocumentRepository,
  ) {}
  async execute(filename: string): Promise<Readable> {
    return this.repository.download(filename);
  }
}
