import { Injectable } from '@nestjs/common';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';

@Injectable()
export class DeleteDocumentUseCase {
  constructor(private readonly storageAdapter: DocumentStoragePort) {}

  async execute(filename: string): Promise<{
    success: boolean;
    message: string;
    deletedAt?: string;
    error?: string;
  }> {
    try {
      // Validar que el archivo existe antes de intentar borrarlo
      const exists = await this.storageAdapter.documentExists(filename);
      if (!exists) {
        return {
          success: false,
          message: `Document '${filename}' not found`,
          error: 'DOCUMENT_NOT_FOUND',
        };
      }

      // Realizar el soft delete (mover a carpeta deleted/)
      await this.storageAdapter.softDeleteDocument(filename);

      return {
        success: true,
        message: `Document '${filename}' deleted successfully`,
        deletedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        message: `Failed to delete document '${filename}'`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
