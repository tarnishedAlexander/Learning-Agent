import { DocumentChunk } from '../entities/document-chunk.entity';

export class DocumentChunkService {
  /**
   * Verifica si el chunk tiene contenido válido
   */
  static isValid(chunk: DocumentChunk): boolean {
    return chunk.content.trim().length > 0 && chunk.chunkIndex >= 0;
  }

  /**
   * Obtiene la longitud del contenido del chunk
   */
  static getContentLength(chunk: DocumentChunk): number {
    return chunk.content.length;
  }

  /**
   * Verifica si el chunk es del tipo especificado
   */
  static isOfType(chunk: DocumentChunk, type: string): boolean {
    return chunk.type === type;
  }

  /**
   * Crea un nuevo chunk con validaciones
   */
  static create(
    id: string,
    documentId: string,
    content: string,
    chunkIndex: number,
    type: string = 'text',
    metadata?: Record<string, any>,
    createdAt?: Date,
    updatedAt?: Date,
  ): DocumentChunk {
    const chunk = new DocumentChunk(
      id,
      documentId,
      content,
      chunkIndex,
      type,
      metadata,
      createdAt || new Date(),
      updatedAt || new Date(),
    );

    if (!this.isValid(chunk)) {
      throw new Error('Invalid chunk: content must not be empty and chunkIndex must be >= 0');
    }

    return chunk;
  }

  /**
   * Valida que un chunk tenga el contenido mínimo requerido
   */
  static validateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Chunk content cannot be empty');
    }
  }

  /**
   * Valida que el índice del chunk sea válido
   */
  static validateChunkIndex(chunkIndex: number): void {
    if (chunkIndex < 0) {
      throw new Error('Chunk index must be >= 0');
    }
  }
}