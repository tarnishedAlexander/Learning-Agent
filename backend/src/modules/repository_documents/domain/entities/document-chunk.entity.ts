export class DocumentChunk {
  constructor(
    public readonly id: string,
    public readonly documentId: string,
    public content: string, 
    public readonly chunkIndex: number,
    public type: string, 
    public readonly metadata?: Record<string, any>,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(), 
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

  isValid(): boolean {
    return this.content.trim().length > 0 && this.chunkIndex >= 0;
  }

  getContentLength(): number {
    return this.content.length;
  }

  isOfType(type: string): boolean {
    return this.type === type;
  }
}