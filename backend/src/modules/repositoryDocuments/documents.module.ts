import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { FILE_STORAGE_REPO } from './tokens';
import { DocumentsController } from './infrastructure/http/documents.controller';
import { S3StorageAdapter } from './infrastructure/storage/S3-storage.adapter';
import { ListDocumentsUseCase } from './application/queries/list-documents.usecase';
import { DeleteDocumentUseCase } from './application/commands/delete-document.usecase';
import { UploadDocumentUseCase } from './application/commands/upload-document.usecase';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [
    // Storage provider
    { provide: FILE_STORAGE_REPO, useClass: S3StorageAdapter },

    // Use cases
    {
      provide: ListDocumentsUseCase,
      useFactory: (storageAdapter: S3StorageAdapter) => {
        return new ListDocumentsUseCase(storageAdapter);
      },
      inject: [FILE_STORAGE_REPO],
    },
    {
      provide: DeleteDocumentUseCase,
      useFactory: (storageAdapter: S3StorageAdapter) => {
        return new DeleteDocumentUseCase(storageAdapter);
      },
      inject: [FILE_STORAGE_REPO],
    },
    {
      provide: UploadDocumentUseCase,
      useFactory: (storageAdapter: S3StorageAdapter) => {
        return new UploadDocumentUseCase(storageAdapter);
      },
      inject: [FILE_STORAGE_REPO],
    },
  ],
  exports: [ListDocumentsUseCase, DeleteDocumentUseCase, UploadDocumentUseCase],
})
export class DocumentsModule {}
