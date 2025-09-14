import { RelationshipType } from '../entities/relationship.entity';
import { ExtractedEntity } from './entity-extraction.service';

export interface RelationshipExtractionService {
  /**
   * Extracts relationships between entities from text
   */
  extractRelationships(
    text: string,
    entities: ExtractedEntity[],
    options?: RelationshipExtractionOptions,
  ): Promise<ExtractedRelationship[]>;

  /**
   * Extracts relationships from document chunks
   */
  extractFromChunks(
    chunks: DocumentChunk[],
    entities: ExtractedEntity[],
    options?: RelationshipExtractionOptions,
  ): Promise<ChunkRelationshipExtraction[]>;

  /**
   * Validates and filters extracted relationships
   */
  validateRelationships(
    relationships: ExtractedRelationship[],
    validationRules?: RelationshipValidationRules,
  ): Promise<ExtractedRelationship[]>;

  /**
   * Merges duplicate relationships
   */
  mergeDuplicateRelationships(
    relationships: ExtractedRelationship[],
  ): Promise<ExtractedRelationship[]>;

  /**
   * Calculates relationship confidence scores
   */
  calculateConfidenceScores(
    relationships: ExtractedRelationship[],
    context: RelationshipContext,
  ): Promise<ExtractedRelationship[]>;

  /**
   * Infers implicit relationships
   */
  inferImplicitRelationships(
    entities: ExtractedEntity[],
    explicitRelationships: ExtractedRelationship[],
  ): Promise<ExtractedRelationship[]>;

  /**
   * Extracts temporal relationships
   */
  extractTemporalRelationships(
    text: string,
    entities: ExtractedEntity[],
  ): Promise<TemporalRelationship[]>;

  /**
   * Extracts causal relationships
   */
  extractCausalRelationships(
    text: string,
    entities: ExtractedEntity[],
  ): Promise<ExtractedRelationship[]>;

  /**
   * Refines relationship types using context
   */
  refineRelationshipTypes(
    relationships: ExtractedRelationship[],
    context: string,
  ): Promise<ExtractedRelationship[]>;

  /**
   * Extracts domain-specific relationships
   */
  extractDomainRelationships(
    text: string,
    entities: ExtractedEntity[],
    domain: string,
    customPatterns?: RelationshipPattern[],
  ): Promise<ExtractedRelationship[]>;
}

export interface RelationshipExtractionOptions {
  enabledTypes?: RelationshipType[];
  confidenceThreshold?: number;
  maxDistance?: number; // Maximum word distance between entities
  useSemanticSimilarity?: boolean;
  useSyntacticPatterns?: boolean;
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

export interface ExtractedRelationship {
  sourceEntity: string;
  targetEntity: string;
  type: RelationshipType;
  confidence: number;
  evidence: RelationshipEvidence[];
  description?: string;
  properties?: Record<string, any>;
  strength?: number;
}

export interface RelationshipEvidence {
  text: string;
  startPosition: number;
  endPosition: number;
  chunkId?: string;
  confidence: number;
  pattern?: string;
}

export interface ChunkRelationshipExtraction {
  chunkId: string;
  relationships: ExtractedRelationship[];
  processingTime: number;
  confidence: number;
}

export interface RelationshipValidationRules {
  minConfidence?: number;
  minEvidenceCount?: number;
  maxDistance?: number;
  allowedTypeCombinations?: Array<{
    sourceType: string;
    targetType: string;
    relationshipTypes: RelationshipType[];
  }>;
  blacklistedPairs?: Array<{
    source: string;
    target: string;
  }>;
  customValidators?: Array<(relationship: ExtractedRelationship) => boolean>;
}

export interface RelationshipContext {
  documentType?: string;
  domain?: string;
  totalWordCount?: number;
  chunkCount?: number;
  entityCount?: number;
  documentTitle?: string;
}

export interface TemporalRelationship extends ExtractedRelationship {
  temporalType: 'before' | 'after' | 'during' | 'simultaneous';
  timeExpression?: string;
  duration?: string;
}

export interface RelationshipPattern {
  name: string;
  pattern: RegExp;
  type: RelationshipType;
  confidence: number;
  sourceEntityTypes?: string[];
  targetEntityTypes?: string[];
  description?: string;
}

export interface RelationshipStrength {
  relationshipId: string;
  strength: number;
  factors: {
    frequency: number;
    evidence: number;
    confidence: number;
    distance: number;
    context: number;
  };
}
