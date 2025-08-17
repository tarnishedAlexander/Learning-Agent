import { Module } from '@nestjs/common';
import { DocumentsController } from './infraestructure/http/documents.controller';
import { UploadDocumentUseCase } from './application/commands/upload-document.usecase';
import { DocumentPrismaRepository } from './infraestructure/persistence/document.prisma.repository';
import { PrismaService } from '../../core/prisma/prisma.service';
import { S3StorageService } from './infraestructure/storage/s3.storage.service';

@Module({
  controllers: [DocumentsController],
  providers: [
    S3StorageService,
    UploadDocumentUseCase,
    { provide: 'DocumentRepository', useClass: DocumentPrismaRepository },
    DocumentPrismaRepository,
    PrismaService,
    {
      provide: UploadDocumentUseCase,
      useFactory: (storage: S3StorageService, repo: DocumentPrismaRepository) =>
        new UploadDocumentUseCase(storage, repo),
      inject: [S3StorageService, DocumentPrismaRepository],
    },
  ],
  exports: [],
})
export class DocumentModule {}
