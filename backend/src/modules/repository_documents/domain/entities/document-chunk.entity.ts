export class DocumentChunk {
  constructor(
    public readonly id: string,
    public readonly documentId: string,
    public content: string, // No readonly para permitir modificaciones durante overlap
    public readonly chunkIndex: number,
    public type: string, // Cambiar de chunkType a type y no readonly
    public readonly metadata?: Record<string, any>,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(), // Agregar updatedAt
  ) {}

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
    return new DocumentChunk(
      id,
      documentId,
      content,
      chunkIndex,
      type,
      metadata,
      createdAt || new Date(),
      updatedAt || new Date(),
    );
  }

  /**
   * Verifica si el chunk tiene contenido válido
   */
  isValid(): boolean {
    return this.content.trim().length > 0 && this.chunkIndex >= 0;
  }

  /**
   * Obtiene la longitud del contenido del chunk
   */
  getContentLength(): number {
    return this.content.length;
  }

  /**
   * Verifica si este chunk es del tipo especificado
   */
  isOfType(type: string): boolean {
    return this.type === type;
  }
}
