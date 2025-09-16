import { Injectable } from '@nestjs/common';
import type { DocumentRepositoryPort } from '../../domain/ports/document-repository.port';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import { ContractDocumentListItem } from '../../domain/entities/contract-document-list-item';

export interface GetDocumentsBySubjectRequest {
  subjectId: string;
  tipo?: string;
  page?: number;
  limit?: number;
}

export interface GetDocumentsBySubjectResponse {
  docs: ContractDocumentListItem[];
  total: number;
  page: number;
}

@Injectable()
export class GetDocumentsBySubjectUseCase {
  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly documentStorage: DocumentStoragePort,
  ) {}

  async execute(
    request: GetDocumentsBySubjectRequest,
  ): Promise<GetDocumentsBySubjectResponse> {
    const { subjectId, tipo, page = 1, limit = 10 } = request;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    try {
      // Obtain documents from the database filtered by course
      const dbDocuments = await this.documentRepository.findByCourseId(
        subjectId,
        offset,
        limit,
        tipo,
      );

      // Obtain the total number of documents for the subject
      const total = await this.documentRepository.countByCourseId(
        subjectId,
        tipo,
      );

      // Create ContractDocumentListItem with correct data
      const documents: ContractDocumentListItem[] = [];

      for (const doc of dbDocuments) {
        try {
          // Check if the file exists in storage
          const exists = await this.documentStorage.documentExists(
            doc.fileName,
          );
          if (!exists) continue;

          // Generate download URL
          const downloadUrl = await this.documentStorage.generateDownloadUrl(
            doc.fileName,
          );

          documents.push(
            new ContractDocumentListItem(
              doc.id,
              doc.fileName,
              doc.originalName,
              doc.mimeType,
              doc.size,
              downloadUrl,
              doc.uploadedAt,
              doc.uploadedBy,
            ),
          );
        } catch (error) {
          // If there is an error with a specific document, we skip it but continue
          console.warn(
            `Error processing document ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          continue;
        }
      }

      return {
        docs: documents,
        total,
        page,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Error al obtener documentos de la materia ${subjectId}: ${errorMessage}`,
      );
    }
  }
}
