import { Readable } from 'stream';
import { DocumentEntity } from '../entities/document.entity';

export interface DocumentRepository {
  save(document: Omit<DocumentEntity, 'id'>): Promise<DocumentEntity>;
  download(minIOKey: string): Promise<Readable>
}
