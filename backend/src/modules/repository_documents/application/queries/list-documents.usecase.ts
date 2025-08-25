import { Injectable } from '@nestjs/common';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import { DocumentListResponse } from '../../domain/value-objects/upload-document.vo';

@Injectable()
export class ListDocumentsUseCase {
  constructor(private readonly documentStorage: DocumentStoragePort) {}

  /**
   * Ejecuta el caso de uso para listar documentos
   * @returns Lista de documentos disponibles, excluyendo los eliminados
   */
  async execute(): Promise<DocumentListResponse> {
    try {
      const allDocuments = await this.documentStorage.listDocuments();

      const activeDocuments = allDocuments.filter(
        (doc) => !doc.fileName.startsWith('deleted/'),
      );

      return new DocumentListResponse(activeDocuments, activeDocuments.length);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Manejar errores específicos de conexión o bucket vacío
      if (
        errorMessage.includes('NoSuchBucket') ||
        errorMessage.includes('bucket does not exist')
      ) {
        throw new Error(
          'Bucket de documentos no encontrado. Verifique la configuración de MinIO.',
        );
      }

      if (
        errorMessage.includes('connection') ||
        errorMessage.includes('ECONNREFUSED')
      ) {
        throw new Error(
          'Error de conexión con MinIO. Verifique que el servicio esté disponible.',
        );
      }
      throw new Error(`Error al listar documentos: ${errorMessage}`);
    }
  }
}
