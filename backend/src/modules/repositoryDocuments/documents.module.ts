import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DOCUMENT_REPO, FILE_STORAGE_REPO } from './tokens';
// TODO: Casos de uso e infraestructura a implementar
// import { DocumentPrismaRepository } from './infrastructure/persistence/document.prisma.repository';
// import { FileStoragePrismaRepository } from './infrastructure/persistence/file-storage.prisma.repository';
// import { CreateDocumentUseCase } from './application/commands/create-document.usecase';
// import { UploadDocumentUseCase } from './application/commands/upload-document.usecase';
// import { ListDocumentsUseCase } from './application/queries/list-documents.usecase';
// import { GetDocumentByIdUseCase } from './application/queries/get-document-by-id.usecase';
import { DocumentsController } from './infrastructure/http/documents.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [
    // { provide: DOCUMENT_REPO, useClass: DocumentPrismaRepository },
    // { provide: FILE_STORAGE_REPO, useClass: FileStoragePrismaRepository },
    // CreateDocumentUseCase,
    // UploadDocumentUseCase,
    // ListDocumentsUseCase,
    // GetDocumentByIdUseCase,
  ],
})
export class DocumentsModule {}
