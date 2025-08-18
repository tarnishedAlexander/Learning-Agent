import { Module } from '@nestjs/common';
import { DocumentsController } from './infraestructure/http/documents.controller';
import { UploadDocumentUseCase } from './application/commands/upload-document.usecase';
import { DocumentPrismaRepository } from './infraestructure/persistence/document.prisma.repository';
import { PrismaService } from '../../core/prisma/prisma.service';
import { S3StorageService } from './infraestructure/storage/S3.storage.service';

@Module({
  controllers: [DocumentsController],
  providers: [
    S3StorageService,
    PrismaService,
    DocumentPrismaRepository,
    {
      provide: 'DocumentRepository',
      useClass: DocumentPrismaRepository,
    },
    UploadDocumentUseCase,
  ],
  exports: [],
})
export class DocumentModule {}
