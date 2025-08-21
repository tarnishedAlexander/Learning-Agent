import { Document } from '../entities/document.entity';
import {
  UploadDocumentRequest,
  DocumentListItem,
} from '../value-objects/upload-document.vo';

export interface DocumentRepository {
  uploadDocument(req: UploadDocumentRequest): Promise<Document>;
  generateDownloadUrl(fileName: string): Promise<string>;
  listDocuments(): Promise<DocumentListItem[]>;
}
