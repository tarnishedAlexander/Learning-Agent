import { Injectable } from '@nestjs/common';
import {
  RelationshipExtractionService,
  ExtractedRelationship,
  RelationshipExtractionOptions,
  DocumentChunk,
  ChunkRelationshipExtraction,
  RelationshipValidationRules,
  RelationshipContext,
  TemporalRelationship,
  RelationshipPattern,
  RelationshipEvidence,
} from '../../domain/services/relationship-extraction.service';
import { RelationshipType } from '../../domain/entities/relationship.entity';
import { ExtractedEntity } from '../../domain/services/entity-extraction.service';

@Injectable()
export class RelationshipExtractor implements RelationshipExtractionService {
  private readonly RELATIONSHIP_PATTERNS = {
    [RelationshipType.IS_A]: [
      /(.+?)\s+(?:is|are)\s+(?:a|an|the)?\s*(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:represents?|defines?|means?)\s+(.+?)(?:\.|,|;|$)/gi,
    ],
    [RelationshipType.PART_OF]: [
      /(.+?)\s+(?:is part of|belongs to|is contained in|is a component of)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:contains?|includes?|comprises?|consists of)\s+(.+?)(?:\.|,|;|$)/gi,
    ],
    [RelationshipType.USES]: [
      /(.+?)\s+(?:uses?|utilizes?|employs?|applies?)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:is used by|is utilized by|is employed by)\s+(.+?)(?:\.|,|;|$)/gi,
    ],
    [RelationshipType.IMPLEMENTS]: [
      /(.+?)\s+(?:implements?|realizes?|executes?)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:is implemented by|is realized by)\s+(.+?)(?:\.|,|;|$)/gi,
    ],
    [RelationshipType.EXTENDS]: [
      /(.+?)\s+(?:extends?|inherits? from|derives? from)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:is extended by|is inherited by)\s+(.+?)(?:\.|,|;|$)/gi,
    ],
    [RelationshipType.DEPENDS_ON]: [
      /(.+?)\s+(?:depends on|relies on|requires?|needs?)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:is required by|is needed by)\s+(.+?)(?:\.|,|;|$)/gi,
    ],
    [RelationshipType.SIMILAR_TO]: [
      /(.+?)\s+(?:is similar to|resembles?|is like|is comparable to)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:and|&)\s+(.+?)\s+(?:are similar|share|have similar)/gi,
    ],
    [RelationshipType.CAUSES]: [
      /(.+?)\s+(?:causes?|leads to|results in|triggers?)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:is caused by|results from|is triggered by)\s+(.+?)(?:\.|,|;|$)/gi,
    ],
    [RelationshipType.ENABLES]: [
      /(.+?)\s+(?:enables?|allows?|facilitates?|supports?)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:is enabled by|is supported by)\s+(.+?)(?:\.|,|;|$)/gi,
    ],
  };

  private readonly TEMPORAL_PATTERNS = [
    /(.+?)\s+(?:before|prior to|preceding)\s+(.+?)(?:\.|,|;|$)/gi,
    /(.+?)\s+(?:after|following|subsequent to)\s+(.+?)(?:\.|,|;|$)/gi,
    /(.+?)\s+(?:during|while|throughout)\s+(.+?)(?:\.|,|;|$)/gi,
    /(.+?)\s+(?:simultaneously with|at the same time as|concurrent with)\s+(.+?)(?:\.|,|;|$)/gi,
  ];

  private readonly CAUSAL_PATTERNS = [
    /(.+?)\s+(?:because of|due to|owing to|as a result of)\s+(.+?)(?:\.|,|;|$)/gi,
    /(.+?)\s+(?:therefore|thus|consequently|hence)\s+(.+?)(?:\.|,|;|$)/gi,
    /(?:if|when)\s+(.+?)\s+(?:then|,)\s*(.+?)(?:\.|,|;|$)/gi,
  ];

  async extractRelationships(
    text: string,
    entities: ExtractedEntity[],
    options: RelationshipExtractionOptions = {},
  ): Promise<ExtractedRelationship[]> {
    const {
      enabledTypes = Object.values(RelationshipType),
      confidenceThreshold = 0.5,
      maxDistance = 100,
      useSyntacticPatterns = true,
      contextWindow = 50,
    } = options;

    const relationships: ExtractedRelationship[] = [];

    if (useSyntacticPatterns) {
      // Extract using pattern matching
      for (const relType of enabledTypes) {
        const patterns = this.RELATIONSHIP_PATTERNS[relType] || [];
        for (const pattern of patterns) {
          const extracted = await this.extractUsingPattern(
            text,
            pattern,
            relType,
            entities,
            contextWindow,
          );
          relationships.push(...extracted);
        }
      }
    }

    // Extract using entity co-occurrence
    const coOccurrenceRels = await this.extractByCoOccurrence(
      text,
      entities,
      maxDistance,
      enabledTypes,
    );
    relationships.push(...coOccurrenceRels);

    // Filter by confidence threshold
    return relationships.filter((rel) => rel.confidence >= confidenceThreshold);
  }

  async extractFromChunks(
    chunks: DocumentChunk[],
    entities: ExtractedEntity[],
    options: RelationshipExtractionOptions = {},
  ): Promise<ChunkRelationshipExtraction[]> {
    const results: ChunkRelationshipExtraction[] = [];

    for (const chunk of chunks) {
      const startTime = Date.now();

      // Filter entities that appear in this chunk
      const chunkEntities = entities.filter(
        (entity) =>
          entity.startPosition >= chunk.startPosition &&
          entity.endPosition <= chunk.endPosition,
      );

      const relationships = await this.extractRelationships(
        chunk.content,
        chunkEntities,
        options,
      );

      const processingTime = Date.now() - startTime;

      results.push({
        chunkId: chunk.id,
        relationships,
        processingTime,
        confidence: this.calculateChunkConfidence(relationships),
      });
    }

    return results;
  }

  async validateRelationships(
    relationships: ExtractedRelationship[],
    validationRules: RelationshipValidationRules = {},
  ): Promise<ExtractedRelationship[]> {
    const {
      minConfidence = 0.3,
      minEvidenceCount = 1,
      maxDistance = 200,
      allowedTypeCombinations = [],
      blacklistedPairs = [],
      customValidators = [],
    } = validationRules;

    return relationships.filter((relationship) => {
      // Confidence check
      if (relationship.confidence < minConfidence) return false;

      // Evidence count check
      if (relationship.evidence.length < minEvidenceCount) return false;

      // Distance check (if evidence has position info)
      if (maxDistance > 0) {
        const hasValidDistance = relationship.evidence.some((evidence) => {
          const distance = evidence.endPosition - evidence.startPosition;
          return distance <= maxDistance;
        });
        if (!hasValidDistance) return false;
      }

      // Type combination check
      if (allowedTypeCombinations.length > 0) {
        const isAllowed = allowedTypeCombinations.some((combo) =>
          combo.relationshipTypes.includes(relationship.type),
        );
        if (!isAllowed) return false;
      }

      // Blacklisted pairs check
      if (
        blacklistedPairs.some(
          (pair) =>
            pair.source === relationship.sourceEntity &&
            pair.target === relationship.targetEntity,
        )
      )
        return false;

      // Custom validators
      if (customValidators.some((validator) => !validator(relationship)))
        return false;

      return true;
    });
  }

  async mergeDuplicateRelationships(
    relationships: ExtractedRelationship[],
  ): Promise<ExtractedRelationship[]> {
    const relationshipMap = new Map<string, ExtractedRelationship>();

    for (const relationship of relationships) {
      const key = this.generateRelationshipKey(relationship);
      const existing = relationshipMap.get(key);

      if (existing) {
        // Merge relationships - combine evidence and take higher confidence
        const merged: ExtractedRelationship = {
          ...relationship,
          confidence: Math.max(existing.confidence, relationship.confidence),
          evidence: [...existing.evidence, ...relationship.evidence],
          strength: Math.max(
            existing.strength || 0,
            relationship.strength || 0,
          ),
        };
        relationshipMap.set(key, merged);
      } else {
        relationshipMap.set(key, relationship);
      }
    }

    return Array.from(relationshipMap.values());
  }

  async calculateConfidenceScores(
    relationships: ExtractedRelationship[],
    context: RelationshipContext,
  ): Promise<ExtractedRelationship[]> {
    return relationships.map((relationship) => {
      const evidenceScore = this.calculateEvidenceScore(relationship.evidence);
      const contextScore = this.calculateContextScore(relationship, context);
      const typeScore = this.getTypeConfidenceScore(relationship.type);

      const newConfidence =
        relationship.confidence * 0.4 +
        evidenceScore * 0.3 +
        contextScore * 0.2 +
        typeScore * 0.1;

      return {
        ...relationship,
        confidence: Math.min(1.0, Math.max(0.0, newConfidence)),
      };
    });
  }

  async inferImplicitRelationships(
    entities: ExtractedEntity[],
    explicitRelationships: ExtractedRelationship[],
  ): Promise<ExtractedRelationship[]> {
    const implicitRelationships: ExtractedRelationship[] = [];

    // Infer transitive relationships
    const transitiveRels = this.inferTransitiveRelationships(
      explicitRelationships,
    );
    implicitRelationships.push(...transitiveRels);

    // Infer inverse relationships
    const inverseRels = this.inferInverseRelationships(explicitRelationships);
    implicitRelationships.push(...inverseRels);

    // Infer relationships based on entity types
    const typeBasedRels = this.inferTypeBasedRelationships(entities);
    implicitRelationships.push(...typeBasedRels);

    return implicitRelationships;
  }

  async extractTemporalRelationships(
    text: string,
    entities: ExtractedEntity[],
  ): Promise<TemporalRelationship[]> {
    const temporalRelationships: TemporalRelationship[] = [];

    for (const pattern of this.TEMPORAL_PATTERNS) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        if (match.index !== undefined && match[1] && match[2]) {
          const sourceEntity = this.findMatchingEntity(match[1], entities);
          const targetEntity = this.findMatchingEntity(match[2], entities);

          if (sourceEntity && targetEntity) {
            const temporalType = this.determineTemporalType(match[0]);
            const relationship: TemporalRelationship = {
              sourceEntity: sourceEntity.name,
              targetEntity: targetEntity.name,
              type: RelationshipType.RELATED_TO,
              confidence: 0.7,
              evidence: [
                {
                  text: match[0],
                  startPosition: match.index,
                  endPosition: match.index + match[0].length,
                  confidence: 0.7,
                },
              ],
              temporalType,
              timeExpression: this.extractTimeExpression(match[0]),
            };
            temporalRelationships.push(relationship);
          }
        }
      }
    }

    return temporalRelationships;
  }

  async extractCausalRelationships(
    text: string,
    entities: ExtractedEntity[],
  ): Promise<ExtractedRelationship[]> {
    const causalRelationships: ExtractedRelationship[] = [];

    for (const pattern of this.CAUSAL_PATTERNS) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        if (match.index !== undefined && match[1] && match[2]) {
          const sourceEntity = this.findMatchingEntity(match[1], entities);
          const targetEntity = this.findMatchingEntity(match[2], entities);

          if (sourceEntity && targetEntity) {
            const relationship: ExtractedRelationship = {
              sourceEntity: sourceEntity.name,
              targetEntity: targetEntity.name,
              type: RelationshipType.CAUSES,
              confidence: 0.8,
              evidence: [
                {
                  text: match[0],
                  startPosition: match.index,
                  endPosition: match.index + match[0].length,
                  confidence: 0.8,
                },
              ],
              strength: 0.8,
            };
            causalRelationships.push(relationship);
          }
        }
      }
    }

    return causalRelationships;
  }

  async refineRelationshipTypes(
    relationships: ExtractedRelationship[],
    context: string,
  ): Promise<ExtractedRelationship[]> {
    return relationships.map((relationship) => {
      const refinedType = this.refineRelationshipType(relationship, context);
      return { ...relationship, type: refinedType };
    });
  }

  async extractDomainRelationships(
    text: string,
    entities: ExtractedEntity[],
    domain: string,
    customPatterns: RelationshipPattern[] = [],
  ): Promise<ExtractedRelationship[]> {
    const relationships: ExtractedRelationship[] = [];

    // Use custom patterns
    for (const pattern of customPatterns) {
      const extracted = await this.extractUsingPattern(
        text,
        pattern.pattern,
        pattern.type,
        entities,
        50,
      );
      relationships.push(...extracted);
    }

    // Add domain-specific extraction logic
    switch (domain.toLowerCase()) {
      case 'database':
        relationships.push(
          ...(await this.extractDatabaseRelationships(text, entities)),
        );
        break;
      case 'programming':
        relationships.push(
          ...(await this.extractProgrammingRelationships(text, entities)),
        );
        break;
      case 'machine-learning':
        relationships.push(
          ...(await this.extractMLRelationships(text, entities)),
        );
        break;
    }

    return relationships;
  }

  private async extractUsingPattern(
    text: string,
    pattern: RegExp,
    relType: RelationshipType,
    entities: ExtractedEntity[],
    contextWindow: number,
  ): Promise<ExtractedRelationship[]> {
    const relationships: ExtractedRelationship[] = [];
    const matches = Array.from(text.matchAll(pattern));

    for (const match of matches) {
      if (match.index !== undefined && match[1] && match[2]) {
        const sourceEntity = this.findMatchingEntity(match[1], entities);
        const targetEntity = this.findMatchingEntity(match[2], entities);

        if (
          sourceEntity &&
          targetEntity &&
          sourceEntity.name !== targetEntity.name
        ) {
          const confidence = this.calculatePatternConfidence(match[0], relType);
          const evidence: RelationshipEvidence = {
            text: match[0],
            startPosition: match.index,
            endPosition: match.index + match[0].length,
            confidence,
            pattern: pattern.source,
          };

          relationships.push({
            sourceEntity: sourceEntity.name,
            targetEntity: targetEntity.name,
            type: relType,
            confidence,
            evidence: [evidence],
            strength: confidence,
          });
        }
      }
    }

    return relationships;
  }

  private async extractByCoOccurrence(
    text: string,
    entities: ExtractedEntity[],
    maxDistance: number,
    enabledTypes: RelationshipType[],
  ): Promise<ExtractedRelationship[]> {
    const relationships: ExtractedRelationship[] = [];

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];

        const distance = Math.abs(
          entity1.startPosition - entity2.startPosition,
        );
        if (distance <= maxDistance) {
          const relType = this.inferRelationshipType(entity1, entity2, text);
          if (enabledTypes.includes(relType)) {
            const confidence = this.calculateCoOccurrenceConfidence(
              entity1,
              entity2,
              distance,
              maxDistance,
            );

            relationships.push({
              sourceEntity: entity1.name,
              targetEntity: entity2.name,
              type: relType,
              confidence,
              evidence: [
                {
                  text: this.extractEvidenceText(text, entity1, entity2),
                  startPosition: Math.min(
                    entity1.startPosition,
                    entity2.startPosition,
                  ),
                  endPosition: Math.max(
                    entity1.endPosition,
                    entity2.endPosition,
                  ),
                  confidence,
                },
              ],
              strength: confidence,
            });
          }
        }
      }
    }

    return relationships;
  }

  private findMatchingEntity(
    text: string,
    entities: ExtractedEntity[],
  ): ExtractedEntity | null {
    const cleanText = text.trim().toLowerCase();

    // Exact match first
    let match = entities.find(
      (entity) => entity.name.toLowerCase() === cleanText,
    );

    if (match) return match;

    // Partial match
    match = entities.find(
      (entity) =>
        cleanText.includes(entity.name.toLowerCase()) ||
        entity.name.toLowerCase().includes(cleanText),
    );

    return match || null;
  }

  private calculatePatternConfidence(
    matchText: string,
    relType: RelationshipType,
  ): number {
    let confidence = 0.6;

    // Boost confidence for specific relationship indicators
    const strongIndicators = {
      [RelationshipType.IS_A]: ['is a', 'is an', 'represents', 'defines'],
      [RelationshipType.PART_OF]: ['part of', 'component of', 'contains'],
      [RelationshipType.USES]: ['uses', 'utilizes', 'employs'],
      [RelationshipType.CAUSES]: ['causes', 'leads to', 'results in'],
    };

    const indicators = strongIndicators[relType] || [];
    for (const indicator of indicators) {
      if (matchText.toLowerCase().includes(indicator)) {
        confidence += 0.2;
        break;
      }
    }

    return Math.min(1.0, confidence);
  }

  private inferRelationshipType(
    entity1: ExtractedEntity,
    entity2: ExtractedEntity,
    context: string,
  ): RelationshipType {
    // Simple heuristics based on entity types
    if (entity1.type === 'CONCEPT' && entity2.type === 'TECHNOLOGY') {
      return RelationshipType.USES;
    }
    if (entity1.type === 'ALGORITHM' && entity2.type === 'DATA_STRUCTURE') {
      return RelationshipType.USES;
    }
    if (entity1.type === 'TECHNOLOGY' && entity2.type === 'FRAMEWORK') {
      return RelationshipType.PART_OF;
    }

    return RelationshipType.RELATED_TO;
  }

  private calculateCoOccurrenceConfidence(
    entity1: ExtractedEntity,
    entity2: ExtractedEntity,
    distance: number,
    maxDistance: number,
  ): number {
    // Closer entities have higher confidence
    const distanceScore = 1 - distance / maxDistance;
    const entityConfidenceScore = (entity1.confidence + entity2.confidence) / 2;

    return (distanceScore * 0.6 + entityConfidenceScore * 0.4) * 0.5; // Lower base confidence for co-occurrence
  }

  private extractEvidenceText(
    text: string,
    entity1: ExtractedEntity,
    entity2: ExtractedEntity,
  ): string {
    const start = Math.min(entity1.startPosition, entity2.startPosition);
    const end = Math.max(entity1.endPosition, entity2.endPosition);
    return text.substring(start, end);
  }

  private calculateChunkConfidence(
    relationships: ExtractedRelationship[],
  ): number {
    if (relationships.length === 0) return 0;
    return (
      relationships.reduce((sum, rel) => sum + rel.confidence, 0) /
      relationships.length
    );
  }

  private generateRelationshipKey(relationship: ExtractedRelationship): string {
    return `${relationship.sourceEntity.toLowerCase()}_${relationship.type}_${relationship.targetEntity.toLowerCase()}`;
  }

  private calculateEvidenceScore(evidence: RelationshipEvidence[]): number {
    if (evidence.length === 0) return 0;

    const avgConfidence =
      evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length;
    const countBonus = Math.min(0.3, evidence.length * 0.1);

    return Math.min(1.0, avgConfidence + countBonus);
  }

  private calculateContextScore(
    relationship: ExtractedRelationship,
    context: RelationshipContext,
  ): number {
    let score = 0.5;

    // Boost score based on document type relevance
    if (context.domain) {
      const domainRelevant = this.isRelationshipRelevantToDomain(
        relationship,
        context.domain,
      );
      if (domainRelevant) score += 0.2;
    }

    return Math.min(1.0, score);
  }

  private getTypeConfidenceScore(type: RelationshipType): number {
    const typeScores = {
      [RelationshipType.IS_A]: 0.9,
      [RelationshipType.PART_OF]: 0.8,
      [RelationshipType.USES]: 0.8,
      [RelationshipType.CAUSES]: 0.9,
      [RelationshipType.IMPLEMENTS]: 0.8,
      [RelationshipType.EXTENDS]: 0.8,
      [RelationshipType.DEPENDS_ON]: 0.7,
      [RelationshipType.SIMILAR_TO]: 0.6,
      [RelationshipType.RELATED_TO]: 0.4,
      [RelationshipType.OTHER]: 0.3,
    };

    return typeScores[type] || 0.5;
  }

  private inferTransitiveRelationships(
    relationships: ExtractedRelationship[],
  ): ExtractedRelationship[] {
    const transitive: ExtractedRelationship[] = [];

    // Simple transitivity for IS_A relationships
    const isARelationships = relationships.filter(
      (r) => r.type === RelationshipType.IS_A,
    );

    for (const rel1 of isARelationships) {
      for (const rel2 of isARelationships) {
        if (rel1.targetEntity === rel2.sourceEntity) {
          transitive.push({
            sourceEntity: rel1.sourceEntity,
            targetEntity: rel2.targetEntity,
            type: RelationshipType.IS_A,
            confidence: Math.min(rel1.confidence, rel2.confidence) * 0.8,
            evidence: [],
            description: `Inferred from ${rel1.sourceEntity} -> ${rel1.targetEntity} -> ${rel2.targetEntity}`,
          });
        }
      }
    }

    return transitive;
  }

  private inferInverseRelationships(
    relationships: ExtractedRelationship[],
  ): ExtractedRelationship[] {
    const inverse: ExtractedRelationship[] = [];

    for (const rel of relationships) {
      const inverseType = this.getInverseRelationshipType(rel.type);
      if (inverseType) {
        inverse.push({
          sourceEntity: rel.targetEntity,
          targetEntity: rel.sourceEntity,
          type: inverseType,
          confidence: rel.confidence * 0.7,
          evidence: rel.evidence,
          description: `Inverse of ${rel.sourceEntity} ${rel.type} ${rel.targetEntity}`,
        });
      }
    }

    return inverse;
  }

  private inferTypeBasedRelationships(
    entities: ExtractedEntity[],
  ): ExtractedRelationship[] {
    const typeBasedRels: ExtractedRelationship[] = [];

    // Infer relationships based on common entity type patterns
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];

        const inferredType = this.inferRelationshipFromTypes(
          entity1.type,
          entity2.type,
        );
        if (inferredType) {
          typeBasedRels.push({
            sourceEntity: entity1.name,
            targetEntity: entity2.name,
            type: inferredType,
            confidence: 0.4,
            evidence: [],
            description: `Inferred from entity types: ${entity1.type} and ${entity2.type}`,
          });
        }
      }
    }

    return typeBasedRels;
  }

  private determineTemporalType(
    text: string,
  ): 'before' | 'after' | 'during' | 'simultaneous' {
    const lowerText = text.toLowerCase();
    if (/before|prior|preceding/.test(lowerText)) return 'before';
    if (/after|following|subsequent/.test(lowerText)) return 'after';
    if (/during|while|throughout/.test(lowerText)) return 'during';
    if (/simultaneously|same time|concurrent/.test(lowerText))
      return 'simultaneous';
    return 'during';
  }

  private extractTimeExpression(text: string): string | undefined {
    const timePattern =
      /\b(?:in|at|on|during|for)\s+(?:the\s+)?([^,.;]+?)(?:\s+(?:period|time|phase))?\b/i;
    const match = text.match(timePattern);
    return match ? match[1].trim() : undefined;
  }

  private refineRelationshipType(
    relationship: ExtractedRelationship,
    context: string,
  ): RelationshipType {
    // Context-based refinement
    const contextLower = context.toLowerCase();

    if (relationship.type === RelationshipType.RELATED_TO) {
      if (/implement|realize|execute/.test(contextLower)) {
        return RelationshipType.IMPLEMENTS;
      }
      if (/cause|lead|result/.test(contextLower)) {
        return RelationshipType.CAUSES;
      }
      if (/use|utilize|employ/.test(contextLower)) {
        return RelationshipType.USES;
      }
    }

    return relationship.type;
  }

  private getInverseRelationshipType(
    type: RelationshipType,
  ): RelationshipType | null {
    const inverseMap = {
      [RelationshipType.IS_A]: RelationshipType.CONTAINS,
      [RelationshipType.PART_OF]: RelationshipType.CONTAINS,
      [RelationshipType.USES]: RelationshipType.ENABLES,
      [RelationshipType.DEPENDS_ON]: RelationshipType.ENABLES,
      [RelationshipType.CAUSES]: null, // Causation is not typically bidirectional
      [RelationshipType.SIMILAR_TO]: RelationshipType.SIMILAR_TO,
      [RelationshipType.RELATED_TO]: RelationshipType.RELATED_TO,
    };

    return inverseMap[type] || null;
  }

  private inferRelationshipFromTypes(
    type1: string,
    type2: string,
  ): RelationshipType | null {
    // Common type-based relationship patterns
    if (type1 === 'ALGORITHM' && type2 === 'DATA_STRUCTURE') {
      return RelationshipType.USES;
    }
    if (type1 === 'CONCEPT' && type2 === 'TECHNOLOGY') {
      return RelationshipType.USES;
    }
    if (type1 === 'FRAMEWORK' && type2 === 'PROGRAMMING_LANGUAGE') {
      return RelationshipType.USES;
    }

    return null;
  }

  private isRelationshipRelevantToDomain(
    relationship: ExtractedRelationship,
    domain: string,
  ): boolean {
    // Domain-specific relevance scoring
    switch (domain.toLowerCase()) {
      case 'database':
        return /table|query|index|relation|sql|database/.test(
          `${relationship.sourceEntity} ${relationship.targetEntity}`.toLowerCase(),
        );
      case 'programming':
        return /class|method|function|variable|code|program/.test(
          `${relationship.sourceEntity} ${relationship.targetEntity}`.toLowerCase(),
        );
      default:
        return true;
    }
  }

  private async extractDatabaseRelationships(
    text: string,
    entities: ExtractedEntity[],
  ): Promise<ExtractedRelationship[]> {
    const relationships: ExtractedRelationship[] = [];

    // Database-specific patterns
    const dbPatterns = [
      /(.+?)\s+(?:references?|foreign key to)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:joins?|is joined with)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:indexes?|is indexed by)\s+(.+?)(?:\.|,|;|$)/gi,
    ];

    for (const pattern of dbPatterns) {
      const extracted = await this.extractUsingPattern(
        text,
        pattern,
        RelationshipType.RELATED_TO,
        entities,
        50,
      );
      relationships.push(...extracted);
    }

    return relationships;
  }

  private async extractProgrammingRelationships(
    text: string,
    entities: ExtractedEntity[],
  ): Promise<ExtractedRelationship[]> {
    const relationships: ExtractedRelationship[] = [];

    // Programming-specific patterns
    const progPatterns = [
      /(.+?)\s+(?:inherits from|extends)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:calls?|invokes?)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:returns?|outputs?)\s+(.+?)(?:\.|,|;|$)/gi,
    ];

    for (const pattern of progPatterns) {
      const extracted = await this.extractUsingPattern(
        text,
        pattern,
        RelationshipType.EXTENDS,
        entities,
        50,
      );
      relationships.push(...extracted);
    }

    return relationships;
  }

  private async extractMLRelationships(
    text: string,
    entities: ExtractedEntity[],
  ): Promise<ExtractedRelationship[]> {
    const relationships: ExtractedRelationship[] = [];

    // ML-specific patterns
    const mlPatterns = [
      /(.+?)\s+(?:trains?|learns from)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:predicts?|classifies?)\s+(.+?)(?:\.|,|;|$)/gi,
      /(.+?)\s+(?:optimizes?|minimizes?)\s+(.+?)(?:\.|,|;|$)/gi,
    ];

    for (const pattern of mlPatterns) {
      const extracted = await this.extractUsingPattern(
        text,
        pattern,
        RelationshipType.USES,
        entities,
        50,
      );
      relationships.push(...extracted);
    }

    return relationships;
  }
}
