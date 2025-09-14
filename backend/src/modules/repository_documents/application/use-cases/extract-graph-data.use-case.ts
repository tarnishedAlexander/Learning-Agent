import { Injectable } from '@nestjs/common';
import type { EntityExtractionService } from '../../domain/services/entity-extraction.service';
import type { RelationshipExtractionService } from '../../domain/services/relationship-extraction.service';
import type { CommunityDetectionService } from '../../domain/services/community-detection.service';
import type { EntityRepository } from '../../domain/repositories/entity.repository';
import type { RelationshipRepository } from '../../domain/repositories/relationship.repository';
import type { CommunityRepository } from '../../domain/repositories/community.repository';
import { Entity, EntityType } from '../../domain/entities/entity.entity';
import {
  Relationship,
  RelationshipType,
} from '../../domain/entities/relationship.entity';
import { Community } from '../../domain/entities/community.entity';
import { ExtractedEntity } from '../../domain/services/entity-extraction.service';
import {
  GraphDocument,
  ExtractedEntity as GraphExtractedEntity,
  ExtractedRelationship,
  GraphProcessingStatus,
} from '../../domain/entities/graph-document.entity';

export interface ExtractGraphDataCommand {
  documentId: string;
  extractedText: string;
  chunks: DocumentChunk[];
  options?: GraphExtractionOptions;
}

export interface DocumentChunk {
  id: string;
  content: string;
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  pageNumber?: number;
}

export interface GraphExtractionOptions {
  entityExtractionOptions?: {
    enabledTypes?: EntityType[];
    confidenceThreshold?: number;
    maxEntitiesPerChunk?: number;
    domainSpecific?: string;
  };
  relationshipExtractionOptions?: {
    enabledTypes?: RelationshipType[];
    confidenceThreshold?: number;
    maxDistance?: number;
    useSyntacticPatterns?: boolean;
  };
  communityDetectionOptions?: {
    algorithm?: 'leiden' | 'louvain' | 'label_propagation';
    minCommunitySize?: number;
    maxCommunitySize?: number;
  };
  skipCommunityDetection?: boolean;
}

export interface GraphExtractionResult {
  documentId: string;
  extractedEntities: ExtractedEntity[];
  extractedRelationships: ExtractedRelationship[];
  detectedCommunities: Community[];
  assignedCommunities: string[];
  processingStats: {
    entityCount: number;
    relationshipCount: number;
    communityCount: number;
    processingTimeMs: number;
    confidence: number;
  };
}

@Injectable()
export class ExtractGraphDataUseCase {
  constructor(
    private readonly entityExtractionService: EntityExtractionService,
    private readonly relationshipExtractionService: RelationshipExtractionService,
    private readonly communityDetectionService: CommunityDetectionService,
    private readonly entityRepository: EntityRepository,
    private readonly relationshipRepository: RelationshipRepository,
    private readonly communityRepository: CommunityRepository,
  ) {}

  async execute(
    command: ExtractGraphDataCommand,
  ): Promise<GraphExtractionResult> {
    const startTime = Date.now();

    try {
      const entityExtractionResult = await this.extractEntities(
        command.chunks,
        command.options?.entityExtractionOptions,
      );

      const relationshipExtractionResult = await this.extractRelationships(
        command.chunks,
        entityExtractionResult.entities,
        command.options?.relationshipExtractionOptions,
      );

      let detectedCommunities: Community[] = [];
      let assignedCommunities: string[] = [];

      if (!command.options?.skipCommunityDetection) {
        const communityResult = await this.detectAndAssignCommunities(
          entityExtractionResult.entities,
          relationshipExtractionResult.relationships,
          command.options?.communityDetectionOptions,
        );
        detectedCommunities = communityResult.detectedCommunities;
        assignedCommunities = communityResult.assignedCommunities;
      }

      await this.saveExtractedData(
        command.documentId,
        entityExtractionResult.entities,
        relationshipExtractionResult.relationships.map((rel) => ({
          name: rel.sourceEntity + '-' + rel.targetEntity,
          sourceEntity: rel.sourceEntity,
          targetEntity: rel.targetEntity,
          type: typeof rel.type === 'string' ? rel.type : String(rel.type),
          description: rel.description,
          confidence: rel.confidence,
          strength: rel.strength ?? rel.confidence ?? 1.0,
          evidence: Array.isArray(rel.evidence)
            ? rel.evidence.map((ev) =>
                typeof ev === 'string' ? ev : JSON.stringify(ev),
              )
            : [],
        })),
        detectedCommunities,
        assignedCommunities,
      );

      const processingTime = Date.now() - startTime;

      return {
        documentId: command.documentId,
        extractedEntities: entityExtractionResult.entities,
        extractedRelationships: relationshipExtractionResult.relationships.map(
          (rel) => ({
            name: rel.sourceEntity + '-' + rel.targetEntity,
            sourceEntity: rel.sourceEntity,
            targetEntity: rel.targetEntity,
            type: typeof rel.type === 'string' ? rel.type : String(rel.type),
            description: rel.description,
            confidence: rel.confidence,
            strength: rel.strength ?? rel.confidence ?? 1.0,
            evidence: Array.isArray(rel.evidence)
              ? rel.evidence.map((ev) =>
                  typeof ev === 'string' ? ev : JSON.stringify(ev),
                )
              : [],
          }),
        ),
        detectedCommunities,
        assignedCommunities,
        processingStats: {
          entityCount: entityExtractionResult.entities.length,
          relationshipCount: relationshipExtractionResult.relationships.length,
          communityCount: detectedCommunities.length,
          processingTimeMs: processingTime,
          confidence: this.calculateOverallConfidence(
            entityExtractionResult.entities,
            relationshipExtractionResult.relationships,
          ),
        },
      };
    } catch (error) {
      throw new Error(`Graph data extraction failed: ${error.message}`);
    }
  }

  private async extractEntities(
    chunks: DocumentChunk[],
    options?: GraphExtractionOptions['entityExtractionOptions'],
  ): Promise<{ entities: ExtractedEntity[]; processingTime: number }> {
    const startTime = Date.now();

    const chunkExtractions =
      await this.entityExtractionService.extractFromChunks(chunks, {
        enabledTypes: options?.enabledTypes,
        confidenceThreshold: options?.confidenceThreshold || 0.5,
        maxEntitiesPerChunk: options?.maxEntitiesPerChunk || 50,
        domainSpecific: options?.domainSpecific,
      });

    // Combine entities from all chunks
    const allEntities: ExtractedEntity[] = [];
    for (const chunkExtraction of chunkExtractions) {
      allEntities.push(
        ...chunkExtraction.entities.map((entity) => ({
          ...entity,
          startPosition: entity.startPosition ?? 0,
          endPosition: entity.endPosition ?? 0,
          context: entity.context ?? '',
          mentions: [],
          type:
            typeof entity.type === 'string'
              ? (EntityType[entity.type as keyof typeof EntityType] ??
                EntityType.OTHER)
              : entity.type,
        })),
      );
    }

    // Merge duplicate entities
    const mergedEntities =
      await this.entityExtractionService.mergeDuplicateEntities(allEntities);

    // Validate entities
    const validatedEntities =
      await this.entityExtractionService.validateEntities(mergedEntities);

    // Enrich entities with additional information
    const enrichedEntities =
      await this.entityExtractionService.enrichEntities(validatedEntities);

    const processingTime = Date.now() - startTime;

    return {
      entities: enrichedEntities,
      processingTime,
    };
  }

  private async extractRelationships(
    chunks: DocumentChunk[],
    entities: ExtractedEntity[],
    options?: GraphExtractionOptions['relationshipExtractionOptions'],
  ): Promise<{
    relationships: ExtractedRelationship[];
    processingTime: number;
  }> {
    const startTime = Date.now();

    const chunkExtractions =
      await this.relationshipExtractionService.extractFromChunks(
        chunks,
        entities,
        {
          enabledTypes: options?.enabledTypes,
          confidenceThreshold: options?.confidenceThreshold || 0.5,
          maxDistance: options?.maxDistance || 100,
          useSyntacticPatterns: options?.useSyntacticPatterns !== false,
        },
      );

    // Combine relationships from all chunks
    const allRelationships: import('../../domain/services/relationship-extraction.service').ExtractedRelationship[] =
      [];
    for (const chunkExtraction of chunkExtractions) {
      allRelationships.push(...chunkExtraction.relationships);
    }

    // Merge duplicate relationships
    const mergedRelationships =
      await this.relationshipExtractionService.mergeDuplicateRelationships(
        allRelationships,
      );

    // Validate relationships
    const validatedRelationships =
      await this.relationshipExtractionService.validateRelationships(
        mergedRelationships,
      );

    // Infer implicit relationships
    const implicitRelationships =
      await this.relationshipExtractionService.inferImplicitRelationships(
        entities,
        validatedRelationships,
      );

    const allValidatedRelationships = [
      ...validatedRelationships,
      ...implicitRelationships,
    ];

    const processingTime = Date.now() - startTime;

    // Map to output type for GraphDocument compatibility
    const mappedRelationships = allValidatedRelationships.map((rel) => ({
      ...rel,
      strength: rel.strength ?? rel.confidence ?? 1.0,
      type:
        typeof rel.type === 'string'
          ? (RelationshipType[rel.type as keyof typeof RelationshipType] ??
            RelationshipType.OTHER)
          : rel.type,
      evidence: Array.isArray(rel.evidence)
        ? rel.evidence.map((ev) =>
            typeof ev === 'string' ? ev : JSON.stringify(ev),
          )
        : [],
    }));

    return {
      relationships: mappedRelationships,
      processingTime,
    };
  }

  private async detectAndAssignCommunities(
    extractedEntities: ExtractedEntity[],
    extractedRelationships: ExtractedRelationship[],
    options?: GraphExtractionOptions['communityDetectionOptions'],
  ): Promise<{
    detectedCommunities: Community[];
    assignedCommunities: string[];
  }> {
    // Convert extracted entities to domain entities (temporary for community detection)
    const domainEntities = extractedEntities.map((entity) =>
      Entity.create(
        this.generateTempId(),
        entity.name,
        typeof entity.type === 'string'
          ? (EntityType[entity.type as keyof typeof EntityType] ??
              EntityType.OTHER)
          : entity.type,
        'temp_community', // Will be updated after community detection
        entity.description,
      ),
    );

    // Convert extracted relationships to domain relationships
    const domainRelationships = extractedRelationships
      .map((rel) =>
        Relationship.create(
          this.generateTempId(),
          this.findEntityIdByName(rel.sourceEntity, domainEntities),
          this.findEntityIdByName(rel.targetEntity, domainEntities),
          typeof rel.type === 'string'
            ? (RelationshipType[rel.type as keyof typeof RelationshipType] ??
                RelationshipType.OTHER)
            : rel.type,
          'temp_community', // Will be updated after community detection
          rel.description,
          rel.strength ?? rel.confidence ?? 1.0,
        ),
      )
      .filter(
        (rel) => rel.sourceId !== 'unknown' && rel.targetId !== 'unknown',
      );

    // Detect communities
    const detectedCommunities =
      await this.communityDetectionService.detectCommunities(
        domainEntities,
        domainRelationships,
        {
          algorithm: options?.algorithm || 'leiden',
          minCommunitySize: options?.minCommunitySize || 3,
          maxCommunitySize: options?.maxCommunitySize || 50,
        },
      );

    // Convert detected communities to domain communities and save them
    const savedCommunities: Community[] = [];
    const assignedCommunities: string[] = [];

    for (const detectedCommunity of detectedCommunities) {
      // Check if a similar community already exists
      const existingCommunity =
        await this.findSimilarCommunity(detectedCommunity);

      let community: Community;
      if (existingCommunity) {
        community = existingCommunity;
      } else {
        // Create new community
        community = Community.create(
          this.generateId(),
          detectedCommunity.name,
          detectedCommunity.description,
        ).withSummary(
          detectedCommunity.description || '',
          detectedCommunity.keyTopics,
        );

        const savedCommunity = await this.communityRepository.save(community);
        savedCommunities.push(savedCommunity);
      }

      assignedCommunities.push(community.id);
    }

    return {
      detectedCommunities: savedCommunities,
      assignedCommunities,
    };
  }

  private async saveExtractedData(
    documentId: string,
    entities: ExtractedEntity[],
    relationships: ExtractedRelationship[],
    communities: Community[],
    assignedCommunityIds: string[],
  ): Promise<void> {
    // Create entity-to-community mapping
    const entityCommunityMap = this.createEntityCommunityMapping(
      entities,
      communities,
    );

    // Save entities
    const savedEntities: Entity[] = [];
    for (const extractedEntity of entities) {
      const communityId =
        entityCommunityMap.get(extractedEntity.name) || assignedCommunityIds[0];

      if (communityId) {
        // Check if entity already exists in this community
        const existingEntity =
          await this.entityRepository.findByNameAndCommunity(
            extractedEntity.name,
            communityId,
          );

        let entity: Entity;
        if (existingEntity) {
          // Update existing entity
          entity = existingEntity
            .incrementFrequency()
            .withImportance(
              Math.max(
                existingEntity.importance,
                extractedEntity.confidence || 0,
              ),
            );
        } else {
          // Create new entity
          entity = Entity.create(
            this.generateId(),
            extractedEntity.name,
            typeof extractedEntity.type === 'string'
              ? (EntityType[extractedEntity.type as keyof typeof EntityType] ??
                  EntityType.OTHER)
              : extractedEntity.type,
            communityId,
            extractedEntity.description,
          ).withImportance(extractedEntity.confidence || 0);
        }

        const savedEntity = await this.entityRepository.save(entity);
        savedEntities.push(savedEntity);
      }
    }

    // Save relationships
    for (const extractedRelationship of relationships) {
      const sourceEntity = savedEntities.find(
        (e) => e.name === extractedRelationship.sourceEntity,
      );
      const targetEntity = savedEntities.find(
        (e) => e.name === extractedRelationship.targetEntity,
      );

      if (sourceEntity && targetEntity) {
        // Check if relationship already exists
        const existingRelationship =
          await this.relationshipRepository.findBetweenEntities(
            sourceEntity.id,
            targetEntity.id,
            typeof extractedRelationship.type === 'string'
              ? (RelationshipType[
                  extractedRelationship.type as keyof typeof RelationshipType
                ] ?? RelationshipType.OTHER)
              : extractedRelationship.type,
          );

        let relationship: Relationship;
        if (existingRelationship.length > 0) {
          // Strengthen existing relationship
          relationship = existingRelationship[0]
            .strengthen(0.1)
            .addDocumentSource(documentId);
        } else {
          // Create new relationship
          relationship = Relationship.create(
            this.generateId(),
            sourceEntity.id,
            targetEntity.id,
            typeof extractedRelationship.type === 'string'
              ? (RelationshipType[
                  extractedRelationship.type as keyof typeof RelationshipType
                ] ?? RelationshipType.OTHER)
              : extractedRelationship.type,
            sourceEntity.communityId,
            extractedRelationship.description,
            extractedRelationship.strength ??
              extractedRelationship.confidence ??
              1.0,
          ).withDocumentSources([documentId]);
        }

        await this.relationshipRepository.save(relationship);
      }
    }

    // Update community counts
    for (const community of communities) {
      const entityCount = savedEntities.filter(
        (e) => e.communityId === community.id,
      ).length;
      const relationshipCount =
        await this.relationshipRepository.findByCommunityId(community.id);

      const updatedCommunity = community.withUpdatedCounts(
        community.documentCount + 1, // Increment document count
        entityCount,
        relationshipCount.length,
      );

      await this.communityRepository.save(updatedCommunity);
    }
  }

  private async findSimilarCommunity(detectedCommunity: {
    keyTopics?: string[];
    name?: string;
    description?: string;
  }): Promise<Community | null> {
    // Search for communities with similar names or topics
    const keyTopics: string[] = Array.isArray(detectedCommunity.keyTopics)
      ? detectedCommunity.keyTopics
      : [];
    const existingCommunities =
      await this.communityRepository.findByKeyTopics(keyTopics);

    for (const existing of existingCommunities) {
      const similarity = this.calculateCommunitySimilarity(
        existing,
        detectedCommunity,
      );
      if (similarity > 0.7) {
        return existing;
      }
    }

    return null;
  }

  private calculateCommunitySimilarity(
    existing: Community,
    detected: { keyTopics?: string[] },
  ): number {
    // Simple similarity based on key topics
    const existingTopics = new Set(existing.keyTopics || []);
    const detectedTopics = new Set(
      Array.isArray(detected.keyTopics) ? detected.keyTopics : [],
    );

    const intersection = new Set(
      [...existingTopics].filter((x) => detectedTopics.has(x)),
    );
    const union = new Set([...existingTopics, ...detectedTopics]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private createEntityCommunityMapping(
    entities: ExtractedEntity[],
    communities: Community[],
  ): Map<string, string> {
    const mapping = new Map<string, string>();

    // Simple mapping - assign entities to first community
    // In a real implementation, this would be more sophisticated
    if (communities.length > 0) {
      entities.forEach((entity) => {
        mapping.set(entity.name, communities[0].id);
      });
    }

    return mapping;
  }

  private findEntityIdByName(entityName: string, entities: Entity[]): string {
    const entity = entities.find((e) => e.name === entityName);
    return entity?.id || 'unknown';
  }

  private calculateOverallConfidence(
    entities: ExtractedEntity[],
    relationships: ExtractedRelationship[],
  ): number {
    const entityConfidences = entities.map((e) => e.confidence);
    const relationshipConfidences = relationships.map((r) => r.confidence);

    const allConfidences = [...entityConfidences, ...relationshipConfidences];

    if (allConfidences.length === 0) return 0;

    return (
      allConfidences.reduce((sum, conf) => sum + conf, 0) /
      allConfidences.length
    );
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTempId(): string {
    return `temp_${Math.random().toString(36).substr(2, 9)}`;
  }
}
