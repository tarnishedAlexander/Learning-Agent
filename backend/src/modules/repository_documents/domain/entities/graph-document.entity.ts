import { Document, DocumentStatus } from './document.entity';

export class GraphDocument extends Document {
  constructor(
    id: string,
    fileName: string,
    originalName: string,
    mimeType: string,
    size: number,
    url: string,
    s3Key: string,
    fileHash: string,
    uploadedBy: string,
    status: DocumentStatus = DocumentStatus.UPLOADED,
    extractedText?: string,
    textHash?: string,
    pageCount?: number,
    documentTitle?: string,
    documentAuthor?: string,
    language?: string,
    uploadedAt: Date = new Date(),
    updatedAt: Date = new Date(),
    public readonly communityIds: string[] = [],
    public readonly extractedEntities: ExtractedEntity[] = [],
    public readonly extractedRelationships: ExtractedRelationship[] = [],
    public readonly graphProcessingStatus: GraphProcessingStatus = GraphProcessingStatus.PENDING,
  ) {
    super(
      id,
      fileName,
      originalName,
      mimeType,
      size,
      url,
      s3Key,
      fileHash,
      uploadedBy,
      status,
      extractedText,
      textHash,
      pageCount,
      documentTitle,
      documentAuthor,
      language,
      uploadedAt,
      updatedAt,
    );
  }

  static fromDocument(document: Document): GraphDocument {
    return new GraphDocument(
      document.id,
      document.fileName,
      document.originalName,
      document.mimeType,
      document.size,
      document.url,
      document.s3Key,
      document.fileHash,
      document.uploadedBy,
      document.status,
      document.extractedText,
      document.textHash,
      document.pageCount,
      document.documentTitle,
      document.documentAuthor,
      document.language,
      document.uploadedAt,
      document.updatedAt,
    );
  }

  /**
   * Updates the document with extracted graph data
   */
  withGraphData(
    entities: ExtractedEntity[],
    relationships: ExtractedRelationship[],
    status: GraphProcessingStatus = GraphProcessingStatus.COMPLETED,
  ): GraphDocument {
    return new GraphDocument(
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
      this.extractedText,
      this.textHash,
      this.pageCount,
      this.documentTitle,
      this.documentAuthor,
      this.language,
      this.uploadedAt,
      new Date(),
      this.communityIds,
      entities,
      relationships,
      status,
    );
  }

  /**
   * Updates the document with assigned communities
   */
  withCommunities(communityIds: string[]): GraphDocument {
    return new GraphDocument(
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
      this.extractedText,
      this.textHash,
      this.pageCount,
      this.documentTitle,
      this.documentAuthor,
      this.language,
      this.uploadedAt,
      new Date(),
      communityIds,
      this.extractedEntities,
      this.extractedRelationships,
      this.graphProcessingStatus,
    );
  }

  /**
   * Updates the graph processing status
   */
  withGraphProcessingStatus(status: GraphProcessingStatus): GraphDocument {
    return new GraphDocument(
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
      this.extractedText,
      this.textHash,
      this.pageCount,
      this.documentTitle,
      this.documentAuthor,
      this.language,
      this.uploadedAt,
      new Date(),
      this.communityIds,
      this.extractedEntities,
      this.extractedRelationships,
      status,
    );
  }

  /**
   * Checks if the document has been processed for graph data
   */
  isGraphProcessed(): boolean {
    return this.graphProcessingStatus === GraphProcessingStatus.COMPLETED;
  }

  /**
   * Checks if the document is ready for graph processing
   */
  isReadyForGraphProcessing(): boolean {
    return this.hasExtractedText() && this.isProcessed();
  }

  /**
   * Checks if the document has extracted entities
   */
  hasExtractedEntities(): boolean {
    return this.extractedEntities.length > 0;
  }

  /**
   * Checks if the document has extracted relationships
   */
  hasExtractedRelationships(): boolean {
    return this.extractedRelationships.length > 0;
  }

  /**
   * Checks if the document is assigned to communities
   */
  hasAssignedCommunities(): boolean {
    return this.communityIds.length > 0;
  }

  /**
   * Gets the number of extracted entities
   */
  getEntityCount(): number {
    return this.extractedEntities.length;
  }

  /**
   * Gets the number of extracted relationships
   */
  getRelationshipCount(): number {
    return this.extractedRelationships.length;
  }

  /**
   * Gets entities by type
   */
  getEntitiesByType(type: string): ExtractedEntity[] {
    return this.extractedEntities.filter((entity) => entity.type === type);
  }

  /**
   * Gets relationships by type
   */
  getRelationshipsByType(type: string): ExtractedRelationship[] {
    return this.extractedRelationships.filter((rel) => rel.type === type);
  }
}

export interface ExtractedEntity {
  name: string;
  type: string;
  description?: string;
  confidence: number;
  mentions: EntityMention[];
  startPosition: number;
  endPosition: number;
  context: string;
}

export interface ExtractedRelationship {
  strength: number;
  sourceEntity: string;
  targetEntity: string;
  type: string;
  description?: string;
  confidence: number;
  evidence: string[];
}

export interface EntityMention {
  chunkId: string;
  startPosition: number;
  endPosition: number;
  context: string;
  confidence: number;
}

export enum GraphProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
