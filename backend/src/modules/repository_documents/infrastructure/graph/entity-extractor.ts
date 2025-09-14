import { Injectable } from '@nestjs/common';
import {
  EntityExtractionService,
  ExtractedEntity,
  EntityExtractionOptions,
  DocumentChunk,
  ChunkEntityExtraction,
  EntityValidationRules,
  EnrichedEntity,
  EntityContext,
  EntityImportanceScore,
  EntityPattern,
} from '../../domain/services/entity-extraction.service';
import { EntityType } from '../../domain/entities/entity.entity';

@Injectable()
export class EntityExtractor implements EntityExtractionService {
  private readonly NER_PATTERNS = {
    [EntityType.PERSON]: [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // First Last
      /\b(?:Dr|Prof|Mr|Ms|Mrs)\.? [A-Z][a-z]+ [A-Z][a-z]+\b/g, // Title First Last
    ],
    [EntityType.TECHNOLOGY]: [
      /\b(?:JavaScript|Python|Java|C\+\+|React|Angular|Vue|Node\.js|Docker|Kubernetes)\b/gi,
      /\b[A-Z][a-zA-Z]*(?:JS|SQL|API|SDK|IDE|OS)\b/g,
    ],
    [EntityType.CONCEPT]: [
      /\b(?:algorithm|data structure|design pattern|methodology|framework|paradigm)\b/gi,
      /\b[a-z]+ (?:theory|principle|concept|model|approach)\b/gi,
    ],
    [EntityType.ALGORITHM]: [
      /\b(?:quicksort|mergesort|binary search|depth-first|breadth-first|dijkstra|A\*)\b/gi,
      /\b[A-Z][a-z]+ (?:algorithm|sort|search)\b/gi,
    ],
    [EntityType.DATA_STRUCTURE]: [
      /\b(?:array|list|stack|queue|tree|graph|hash table|heap|trie)\b/gi,
      /\b(?:binary tree|linked list|hash map|priority queue)\b/gi,
    ],
    [EntityType.FUNCTION]: [
      /\bfunction\s+[a-zA-Z_][a-zA-Z0-9_]*\b/g, // function declarations
      /\b[a-zA-Z_][a-zA-Z0-9_]*\s*\(/g, // function calls
    ],
    [EntityType.CLASS]: [
      /\bclass\s+[A-Z][a-zA-Z0-9_]*\b/g, // class declarations
    ],
    [EntityType.LIBRARY]: [
      /\b(?:NumPy|Pandas|TensorFlow|Scikit-learn|Express|Flask|Spring|Hibernate|Lodash|Moment|Requests|BeautifulSoup)\b/gi,
    ],
    [EntityType.API]: [
      /\b[A-Z][a-zA-Z0-9_]*API\b/g, // API names
    ],
  };

  async extractEntities(
    text: string,
    options: EntityExtractionOptions = {},
  ): Promise<ExtractedEntity[]> {
    const {
      enabledTypes = Object.values(EntityType),
      confidenceThreshold = 0.5,
      maxEntitiesPerChunk = 50,
      useCustomPatterns = true,
      contextWindow = 50,
    } = options;

    const entities: ExtractedEntity[] = [];

    // Extract using pattern matching
    if (useCustomPatterns) {
      for (const entityType of enabledTypes) {
        const patterns = this.NER_PATTERNS[entityType] || [];
        for (const pattern of patterns) {
          const matches = Array.from(text.matchAll(pattern));
          for (const match of matches) {
            if (match.index !== undefined) {
              const entity = this.createExtractedEntity(
                match[0],
                entityType,
                match.index,
                text,
                contextWindow,
              );
              if (entity.confidence >= confidenceThreshold) {
                entities.push(entity);
              }
            }
          }
        }
      }
    }

    // Extract using NLP techniques (simplified)
    const nlpEntities = await this.extractUsingNLP(text, enabledTypes);
    entities.push(
      ...nlpEntities.filter((e) => e.confidence >= confidenceThreshold),
    );

    // Remove duplicates and limit results
    const uniqueEntities = this.removeDuplicates(entities);
    return uniqueEntities.slice(0, maxEntitiesPerChunk);
  }

  async extractFromChunks(
    chunks: DocumentChunk[],
    options: EntityExtractionOptions = {},
  ): Promise<ChunkEntityExtraction[]> {
    const results: ChunkEntityExtraction[] = [];

    for (const chunk of chunks) {
      const startTime = Date.now();
      const entities = await this.extractEntities(chunk.content, options);
      const processingTime = Date.now() - startTime;

      // Update entity positions to be relative to document
      const adjustedEntities = entities.map((entity) => ({
        ...entity,
        startPosition: entity.startPosition + chunk.startPosition,
        endPosition: entity.endPosition + chunk.startPosition,
      }));

      results.push({
        chunkId: chunk.id,
        entities: adjustedEntities,
        processingTime,
        confidence: this.calculateChunkConfidence(adjustedEntities),
      });
    }

    return results;
  }

  async validateEntities(
    entities: ExtractedEntity[],
    validationRules: EntityValidationRules = {},
  ): Promise<ExtractedEntity[]> {
    const {
      minConfidence = 0.3,
      minLength = 2,
      maxLength = 100,
      blacklistedTerms = [],
      requiredPatterns = [],
      customValidators = [],
    } = validationRules;

    return entities.filter((entity) => {
      // Confidence check
      if (entity.confidence < minConfidence) return false;

      // Length checks
      if (entity.name.length < minLength || entity.name.length > maxLength)
        return false;

      // Blacklist check
      if (
        blacklistedTerms.some((term) =>
          entity.name.toLowerCase().includes(term.toLowerCase()),
        )
      )
        return false;

      // Pattern checks
      if (
        requiredPatterns.length > 0 &&
        !requiredPatterns.some((pattern) => pattern.test(entity.name))
      ) {
        return false;
      }

      // Custom validators
      if (customValidators.some((validator) => !validator(entity)))
        return false;

      return true;
    });
  }

  async mergeDuplicateEntities(
    entities: ExtractedEntity[],
  ): Promise<ExtractedEntity[]> {
    const entityMap = new Map<string, ExtractedEntity>();

    for (const entity of entities) {
      const key = this.generateEntityKey(entity);
      const existing = entityMap.get(key);

      if (existing) {
        // Merge entities - keep the one with higher confidence
        if (entity.confidence > existing.confidence) {
          entityMap.set(key, {
            ...entity,
            aliases: [...(existing.aliases || []), ...(entity.aliases || [])],
          });
        } else {
          entityMap.set(key, {
            ...existing,
            aliases: [...(existing.aliases || []), ...(entity.aliases || [])],
          });
        }
      } else {
        entityMap.set(key, entity);
      }
    }

    return Array.from(entityMap.values());
  }

  async enrichEntities(entities: ExtractedEntity[]): Promise<EnrichedEntity[]> {
    const enrichedEntities: EnrichedEntity[] = [];

    for (const entity of entities) {
      const enriched: EnrichedEntity = {
        ...entity,
        definition: await this.getEntityDefinition(entity.name, entity.type),
        relatedTerms: await this.findRelatedTerms(entity.name),
        category: this.categorizeEntity(entity),
      };

      enrichedEntities.push(enriched);
    }

    return enrichedEntities;
  }

  async calculateImportanceScores(
    entities: ExtractedEntity[],
    context: EntityContext,
  ): Promise<EntityImportanceScore[]> {
    const scores: EntityImportanceScore[] = [];

    for (const entity of entities) {
      const frequency = this.calculateFrequency(entity, entities);
      const position = this.calculatePositionScore(entity, context);
      const contextScore = this.calculateContextScore(entity, context);
      const typeScore = this.getTypeImportanceScore(entity.type);
      const confidence = entity.confidence;

      const totalScore =
        frequency * 0.3 +
        position * 0.2 +
        contextScore * 0.2 +
        typeScore * 0.15 +
        confidence * 0.15;

      scores.push({
        entityName: entity.name,
        score: totalScore,
        factors: {
          frequency,
          position,
          context: contextScore,
          type: typeScore,
          confidence,
        },
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  async findEntityAliases(
    entity: ExtractedEntity,
    text: string,
  ): Promise<string[]> {
    const aliases: string[] = [];
    const entityName = entity.name.toLowerCase();

    // Find acronyms
    const acronymPattern = new RegExp(
      `\\b${entityName}\\s*\\(([A-Z]{2,})\\)`,
      'gi',
    );
    const acronymMatches = text.matchAll(acronymPattern);
    for (const match of acronymMatches) {
      aliases.push(match[1]);
    }

    // Find variations (plurals, different cases)
    const variations = this.generateNameVariations(entity.name);
    for (const variation of variations) {
      if (
        text.toLowerCase().includes(variation.toLowerCase()) &&
        variation.toLowerCase() !== entityName
      ) {
        aliases.push(variation);
      }
    }

    return [...new Set(aliases)];
  }

  async refineEntityTypes(
    entities: ExtractedEntity[],
  ): Promise<ExtractedEntity[]> {
    return entities.map((entity) => {
      const refinedType = this.refineEntityType(entity);
      return { ...entity, type: refinedType };
    });
  }

  async extractDomainEntities(
    text: string,
    domain: string,
    customPatterns: EntityPattern[] = [],
  ): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];

    // Use custom patterns for domain-specific extraction
    for (const pattern of customPatterns) {
      const matches = Array.from(text.matchAll(pattern.pattern));
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            name: match[0],
            type: pattern.type,
            confidence: pattern.confidence,
            startPosition: match.index,
            endPosition: match.index + match[0].length,
            context: this.extractContext(text, match.index, 50),
            mentions: [],
            description: pattern.description,
          });
        }
      }
    }

    // Add domain-specific logic based on domain
    switch (domain.toLowerCase()) {
      case 'database':
        entities.push(...(await this.extractDatabaseEntities(text)));
        break;
      case 'programming':
        entities.push(...(await this.extractProgrammingEntities(text)));
        break;
      case 'machine-learning':
        entities.push(...(await this.extractMLEntities(text)));
        break;
    }

    return entities;
  }

  private createExtractedEntity(
    name: string,
    type: EntityType,
    position: number,
    text: string,
    contextWindow: number,
  ): ExtractedEntity {
    return {
      name: name.trim(),
      type,
      confidence: this.calculateConfidence(name, type, text),
      startPosition: position,
      endPosition: position + name.length,
      context: this.extractContext(text, position, contextWindow),
      mentions: [],
    };
  }

  private async extractUsingNLP(
    text: string,
    enabledTypes: EntityType[],
  ): Promise<ExtractedEntity[]> {
    // Simplified NLP extraction - in a real implementation, you would use
    // libraries like spaCy, Stanford NER, or cloud services
    const entities: ExtractedEntity[] = [];

    // Basic noun phrase extraction
    const nounPhrases = this.extractNounPhrases(text);
    for (const phrase of nounPhrases) {
      const type = this.classifyEntityType(phrase.text);
      if (enabledTypes.includes(type)) {
        entities.push({
          name: phrase.text,
          type,
          confidence: phrase.confidence,
          startPosition: phrase.position,
          endPosition: phrase.position + phrase.text.length,
          context: this.extractContext(text, phrase.position, 50),
          mentions: [],
        });
      }
    }

    return entities;
  }

  private extractNounPhrases(
    text: string,
  ): Array<{ text: string; position: number; confidence: number }> {
    // Simplified noun phrase extraction
    const phrases: Array<{
      text: string;
      position: number;
      confidence: number;
    }> = [];

    // Pattern for capitalized words (potential proper nouns)
    const capitalizedPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const matches = Array.from(text.matchAll(capitalizedPattern));

    for (const match of matches) {
      if (match.index !== undefined && match[0].length > 2) {
        phrases.push({
          text: match[0],
          position: match.index,
          confidence: 0.6,
        });
      }
    }

    return phrases;
  }

  private classifyEntityType(text: string): EntityType {
    const lowerText = text.toLowerCase();

    // Technology keywords
    if (
      /\b(?:javascript|python|java|react|angular|docker|kubernetes|api|database|sql)\b/.test(
        lowerText,
      )
    ) {
      return EntityType.TECHNOLOGY;
    }

    // Algorithm keywords
    if (/\b(?:sort|search|algorithm|tree|graph|hash)\b/.test(lowerText)) {
      return EntityType.ALGORITHM;
    }

    // Concept keywords
    if (
      /\b(?:pattern|principle|theory|model|approach|methodology)\b/.test(
        lowerText,
      )
    ) {
      return EntityType.CONCEPT;
    }

    // Person names (simple heuristic)
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(text)) {
      return EntityType.PERSON;
    }

    return EntityType.OTHER;
  }

  private calculateConfidence(
    name: string,
    type: EntityType,
    text: string,
  ): number {
    let confidence = 0.5;

    // Boost confidence for exact pattern matches
    const patterns = this.NER_PATTERNS[type] || [];
    for (const pattern of patterns) {
      if (pattern.test(name)) {
        confidence += 0.3;
        break;
      }
    }

    // Boost confidence for capitalized terms
    if (/^[A-Z]/.test(name)) {
      confidence += 0.1;
    }

    // Boost confidence for longer terms
    if (name.length > 10) {
      confidence += 0.1;
    }

    // Reduce confidence for very common words
    const commonWords = [
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
    ];
    if (commonWords.includes(name.toLowerCase())) {
      confidence -= 0.4;
    }

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  private extractContext(
    text: string,
    position: number,
    windowSize: number,
  ): string {
    const start = Math.max(0, position - windowSize);
    const end = Math.min(text.length, position + windowSize);
    return text.substring(start, end);
  }

  private removeDuplicates(entities: ExtractedEntity[]): ExtractedEntity[] {
    const seen = new Set<string>();
    return entities.filter((entity) => {
      const key = `${entity.name.toLowerCase()}_${entity.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private calculateChunkConfidence(entities: ExtractedEntity[]): number {
    if (entities.length === 0) return 0;
    return (
      entities.reduce((sum, entity) => sum + entity.confidence, 0) /
      entities.length
    );
  }

  private generateEntityKey(entity: ExtractedEntity): string {
    return `${entity.name.toLowerCase().trim()}_${entity.type}`;
  }

  private async getEntityDefinition(
    name: string,
    type: EntityType,
  ): Promise<string | undefined> {
    // In a real implementation, this would query external knowledge bases
    // For now, return undefined
    return undefined;
  }

  private async findRelatedTerms(name: string): Promise<string[]> {
    // In a real implementation, this would use semantic similarity
    return [];
  }

  private categorizeEntity(entity: ExtractedEntity): string {
    return entity.type.toLowerCase();
  }

  private calculateFrequency(
    entity: ExtractedEntity,
    allEntities: ExtractedEntity[],
  ): number {
    const count = allEntities.filter(
      (e) => e.name.toLowerCase() === entity.name.toLowerCase(),
    ).length;
    return Math.min(1.0, count / 10); // Normalize to 0-1
  }

  private calculatePositionScore(
    entity: ExtractedEntity,
    context: EntityContext,
  ): number {
    // Entities appearing earlier in the document get higher scores
    const totalWords = context.totalWordCount || 1000;
    const relativePosition = entity.startPosition / totalWords;
    return Math.max(0, 1 - relativePosition);
  }

  private calculateContextScore(
    entity: ExtractedEntity,
    context: EntityContext,
  ): number {
    // Score based on context relevance
    let score = 0.5;

    if (
      context.documentTitle &&
      context.documentTitle.toLowerCase().includes(entity.name.toLowerCase())
    ) {
      score += 0.3;
    }

    return Math.min(1.0, score);
  }

  private getTypeImportanceScore(type: EntityType): number {
    const typeScores = {
      [EntityType.CONCEPT]: 0.9,
      [EntityType.TECHNOLOGY]: 0.8,
      [EntityType.ALGORITHM]: 0.8,
      [EntityType.METHODOLOGY]: 0.7,
      [EntityType.PERSON]: 0.6,
      [EntityType.TOOL]: 0.6,
      [EntityType.FRAMEWORK]: 0.7,
      [EntityType.DATA_STRUCTURE]: 0.8,
      [EntityType.PROGRAMMING_LANGUAGE]: 0.7,
      [EntityType.ORGANIZATION]: 0.5,
      [EntityType.LOCATION]: 0.3,
      [EntityType.OTHER]: 0.2,
    };

    return typeScores[type] || 0.5;
  }

  private generateNameVariations(name: string): string[] {
    const variations = [name];

    // Add plural
    variations.push(name + 's');
    variations.push(name + 'es');

    // Add different cases
    variations.push(name.toLowerCase());
    variations.push(name.toUpperCase());

    return variations;
  }

  private refineEntityType(entity: ExtractedEntity): EntityType {
    const name = entity.name.toLowerCase();

    // More specific classification based on context
    if (entity.type === EntityType.OTHER) {
      if (/\b(?:class|method|function|variable|object)\b/.test(name)) {
        return EntityType.CONCEPT;
      }
      if (/\b(?:server|client|database|api|service)\b/.test(name)) {
        return EntityType.TECHNOLOGY;
      }
    }

    return entity.type;
  }

  private async extractDatabaseEntities(
    text: string,
  ): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    const dbPatterns = [
      /\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/gi,
      /\b(?:table|index|view|procedure|function|trigger)\b/gi,
      /\b(?:primary key|foreign key|constraint|relationship)\b/gi,
    ];

    for (const pattern of dbPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            name: match[0],
            type: EntityType.CONCEPT,
            confidence: 0.8,
            startPosition: match.index,
            endPosition: match.index + match[0].length,
            context: this.extractContext(text, match.index, 30),
            mentions: [],
          });
        }
      }
    }

    return entities;
  }

  private async extractProgrammingEntities(
    text: string,
  ): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    const progPatterns = [
      /\b(?:class|interface|enum|struct|namespace)\s+([A-Z][a-zA-Z0-9]*)\b/gi,
      /\b(?:function|method|procedure)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/gi,
      /\b(?:variable|constant|parameter)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/gi,
    ];

    for (const pattern of progPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        if (match.index !== undefined && match[1]) {
          entities.push({
            name: match[1],
            type: EntityType.CONCEPT,
            confidence: 0.7,
            startPosition: match.index,
            endPosition: match.index + match[0].length,
            context: this.extractContext(text, match.index, 40),
            mentions: [],
          });
        }
      }
    }

    return entities;
  }

  private async extractMLEntities(text: string): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    const mlPatterns = [
      /\b(?:neural network|deep learning|machine learning|artificial intelligence)\b/gi,
      /\b(?:regression|classification|clustering|reinforcement learning)\b/gi,
      /\b(?:gradient descent|backpropagation|cross-validation|overfitting)\b/gi,
    ];

    for (const pattern of mlPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        if (match.index !== undefined) {
          entities.push({
            name: match[0],
            type: EntityType.CONCEPT,
            confidence: 0.9,
            startPosition: match.index,
            endPosition: match.index + match[0].length,
            context: this.extractContext(text, match.index, 50),
            mentions: [],
          });
        }
      }
    }

    return entities;
  }
}
