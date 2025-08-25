import { Injectable, NotFoundException } from '@nestjs/common';
import type { DocumentStoragePort } from '../../domain/ports/document-storage.port';

@Injectable()
export class DownloadDocumentUseCase {
  constructor(private readonly storageAdapter: DocumentStoragePort) {}

  /**
   * Genera una URL de descarga para el archivo solicitado.
   * Lanza NotFoundException si el documento no existe.
   */
  async execute(fileName: string): Promise<string> {
    // Validar existencia
    const exists = await this.storageAdapter.documentExists(fileName);
    if (!exists) {
      throw new NotFoundException(`Documento "${fileName}" no encontrado`);
    }

    // Generar URL (presigned url u otra estrategia implementada por el adapter)
    const url = await this.storageAdapter.generateDownloadUrl(fileName);

    if (!url) {
      // Caso improbable: adapter no devuelve URL
      throw new Error(`No se pudo generar la URL de descarga para ${fileName}`);
    }

    return url;
  }
}
