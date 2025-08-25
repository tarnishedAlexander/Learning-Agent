export class Document {
  constructor(
    public readonly id: string,
    public readonly fileName: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly url: string,
    public readonly s3Key: string,
    public readonly fileHash: string,
    public readonly uploadedBy: string,
    public readonly status: DocumentStatus = DocumentStatus.UPLOADED,
    public readonly extractedText?: string,
    public readonly pageCount?: number,
    public readonly documentTitle?: string,
    public readonly documentAuthor?: string,
    public readonly language?: string,
    public readonly uploadedAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    fileName: string,
    originalName: string,
    mimeType: string,
    size: number,
    url: string,
    s3Key: string,
    fileHash: string,
    uploadedBy: string,
  ): Document {
    return new Document(
      id,
      fileName,
      originalName,
      mimeType,
      size,
      url,
      s3Key,
      fileHash,
      uploadedBy,
      DocumentStatus.UPLOADED,
    );
  }

  withExtractedText(
    extractedText: string,
    pageCount?: number,
    documentTitle?: string,
    documentAuthor?: string,
    language?: string,
  ): Document {
    return new Document(
      this.id,
      this.fileName,
      this.originalName,
      this.mimeType,
      this.size,
      this.url,
      this.s3Key,
      this.fileHash,
      this.uploadedBy,
      this.status,
      extractedText,
      pageCount,
      documentTitle,
      documentAuthor,
      language,
      this.uploadedAt,
      new Date(),
    );
  }

  withStatus(status: DocumentStatus): Document {
    return new Document(
      this.id,
      this.fileName,
      this.originalName,
      this.mimeType,
      this.size,
      this.url,
      this.s3Key,
      this.fileHash,
      this.uploadedBy,
      status,
      this.extractedText,
      this.pageCount,
      this.documentTitle,
      this.documentAuthor,
      this.language,
      this.uploadedAt,
      new Date(),
    );
  }

  isReadyForProcessing(): boolean {
    return this.status === DocumentStatus.UPLOADED;
  }

  isProcessed(): boolean {
    return this.status === DocumentStatus.PROCESSED;
  }

  hasExtractedText(): boolean {
    return Boolean(this.extractedText && this.extractedText.trim().length > 0);
  }
}

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  ERROR = 'ERROR',
  DELETED = 'DELETED',
}