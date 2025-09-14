import { EntityType } from '../entities/entity.entity';

export interface EntityExtractionService {
  /**
   * Extracts entities from text content
   */
  extractEntities(
    text: string,
    options?: EntityExtractionOptions,
  ): Promise<ExtractedEntity[]>;

  /**
   * Extracts entities from document chunks
   */
  extractFromChunks(
    chunks: DocumentChunk[],
    options?: EntityExtractionOptions,
  ): Promise<ChunkEntityExtraction[]>;

  /**
   * Validates and filters extracted entities
   */
  validateEntities(
    entities: ExtractedEntity[],
    validationRules?: EntityValidationRules,
  ): Promise<ExtractedEntity[]>;

  /**
   * Merges duplicate entities
   */
  mergeDuplicateEntities(
    entities: ExtractedEntity[],
  ): Promise<ExtractedEntity[]>;

  /**
   * Enriches entities with additional information
   */
  enrichEntities(entities: ExtractedEntity[]): Promise<EnrichedEntity[]>;

  /**
   * Calculates entity importance scores
   */
  calculateImportanceScores(
    entities: ExtractedEntity[],
    context: EntityContext,
  ): Promise<EntityImportanceScore[]>;

  /**
   * Finds entity aliases and variations
   */
  findEntityAliases(entity: ExtractedEntity, text: string): Promise<string[]>;

  /**
   * Classifies entity types more precisely
   */
  refineEntityTypes(entities: ExtractedEntity[]): Promise<ExtractedEntity[]>;

  /**
   * Extracts domain-specific entities
   */
  extractDomainEntities(
    text: string,
    domain: string,
    customPatterns?: EntityPattern[],
  ): Promise<ExtractedEntity[]>;
}

export interface EntityExtractionOptions {
  enabledTypes?: EntityType[];
  confidenceThreshold?: number;
  maxEntitiesPerChunk?: number;
  useCustomPatterns?: boolean;
  domainSpecific?: string;
  language?: string;
  contextWindow?: number;
}

export interface DocumentChunk {
  id: string;
  content: string;
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  pageNumber?: number;
}

export interface ExtractedEntity {
  mentions: never[];
  name: string;
  type: EntityType;
  confidence: number;
  startPosition: number;
  endPosition: number;
  context: string;
  description?: string;
  aliases?: string[];
  properties?: Record<string, any>;
}

export interface ChunkEntityExtraction {
  chunkId: string;
  entities: ExtractedEntity[];
  processingTime: number;
  confidence: number;
}

export interface EntityValidationRules {
  minConfidence?: number;
  minLength?: number;
  maxLength?: number;
  blacklistedTerms?: string[];
  requiredPatterns?: RegExp[];
  customValidators?: Array<(entity: ExtractedEntity) => boolean>;
}

export interface EnrichedEntity extends ExtractedEntity {
  wikipediaUrl?: string;
  dbpediaUrl?: string;
  definition?: string;
  relatedTerms?: string[];
  category?: string;
  importance?: number;
  frequency?: number;
}

export interface EntityContext {
  documentType?: string;
  domain?: string;
  totalWordCount?: number;
  chunkCount?: number;
  documentTitle?: string;
  documentAuthor?: string;
}

export interface EntityImportanceScore {
  entityName: string;
  score: number;
  factors: {
    frequency: number;
    position: number;
    context: number;
    type: number;
    confidence: number;
  };
}

export interface EntityPattern {
  name: string;
  pattern: RegExp;
  type: EntityType;
  confidence: number;
  description?: string;
}

export interface EntityMention {
  chunkId: string;
  startPosition: number;
  endPosition: number;
  context: string;
  confidence: number;
}
