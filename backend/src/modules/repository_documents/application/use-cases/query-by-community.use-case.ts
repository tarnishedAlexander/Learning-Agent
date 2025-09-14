import { Injectable } from '@nestjs/common';
import type { CommunityRepository } from '../../domain/repositories/community.repository';
import type { EntityRepository } from '../../domain/repositories/entity.repository';
import type { RelationshipRepository } from '../../domain/repositories/relationship.repository';
import type {
  GraphQueryRepository,
  CommunityMatch,
  EntityMatch,
  TopicSubgraph,
} from '../../domain/repositories/graph-query.repository';
import { Community } from '../../domain/entities/community.entity';
import { Entity } from '../../domain/entities/entity.entity';
import { Relationship } from '../../domain/entities/relationship.entity';

export interface QueryByCommunityCommand {
  query: string;
  communityIds?: string[];
  options?: QueryOptions;
}

export interface QueryOptions {
  maxResults?: number;
  includeRelatedConcepts?: boolean;
  maxHops?: number;
  confidenceThreshold?: number;
  entityTypes?: string[];
  relationshipTypes?: string[];
  includeSubgraph?: boolean;
}

export interface CommunityQueryResult {
  query: string;
  relevantCommunities: CommunityMatch[];
  matchingEntities: EntityMatch[];
  relatedConcepts: Entity[];
  relationships: Relationship[];
  topicSubgraph?: TopicSubgraph;
  queryStats: {
    totalCommunities: number;
    totalEntities: number;
    totalRelationships: number;
    processingTimeMs: number;
    averageRelevanceScore: number;
  };
}

@Injectable()
export class QueryByCommunityUseCase {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly entityRepository: EntityRepository,
    private readonly relationshipRepository: RelationshipRepository,
    private readonly graphQueryRepository: GraphQueryRepository,
  ) {}

  async execute(
    command: QueryByCommunityCommand,
  ): Promise<CommunityQueryResult> {
    const startTime = Date.now();

    try {
      // Find relevant communities
      const relevantCommunities = await this.findRelevantCommunities(
        command.query,
        command.communityIds,
        command.options?.maxResults || 10,
      );

      // Find matching entities within relevant communities
      const matchingEntities = await this.findMatchingEntities(
        command.query,
        relevantCommunities.map((c) => c.community.id),
        command.options,
      );

      // Find related concepts if requested
      let relatedConcepts: Entity[] = [];
      if (command.options?.includeRelatedConcepts) {
        relatedConcepts = await this.findRelatedConcepts(
          matchingEntities.map((e) => e.entity.id),
          relevantCommunities.map((c) => c.community.id),
          command.options?.maxHops || 2,
        );
      }

      // Get relationships between entities
      const relationships = await this.getRelevantRelationships(
        [...matchingEntities.map((e) => e.entity), ...relatedConcepts],
        command.options?.relationshipTypes,
      );

      // Build topic subgraph if requested
      let topicSubgraph: TopicSubgraph | undefined;
      if (command.options?.includeSubgraph) {
        topicSubgraph = await this.buildTopicSubgraph(
          command.query,
          relevantCommunities.map((c) => c.community.id),
          command.options?.maxResults || 20,
        );
      }

      const processingTime = Date.now() - startTime;

      return {
        query: command.query,
        relevantCommunities,
        matchingEntities,
        relatedConcepts,
        relationships,
        topicSubgraph,
        queryStats: {
          totalCommunities: relevantCommunities.length,
          totalEntities: matchingEntities.length + relatedConcepts.length,
          totalRelationships: relationships.length,
          processingTimeMs: processingTime,
          averageRelevanceScore: this.calculateAverageRelevance(
            relevantCommunities,
            matchingEntities,
          ),
        },
      };
    } catch (error) {
      throw new Error(`Community query failed: ${error.message}`);
    }
  }

  private async findRelevantCommunities(
    query: string,
    communityIds?: string[],
    maxResults: number = 10,
  ): Promise<CommunityMatch[]> {
    if (communityIds && communityIds.length > 0) {
      // Query specific communities
      const communities: Community[] = [];
      for (const id of communityIds) {
        const community = await this.communityRepository.findById(id);
        if (community) {
          communities.push(community);
        }
      }

      // Calculate relevance scores for specified communities
      return this.calculateCommunityRelevance(query, communities);
    } else {
      // Find relevant communities using graph query repository
      return await this.graphQueryRepository.findRelevantCommunities(
        query,
        maxResults,
      );
    }
  }

  private async findMatchingEntities(
    query: string,
    communityIds: string[],
    options?: QueryOptions,
  ): Promise<EntityMatch[]> {
    const allMatches: EntityMatch[] = [];

    // Use graph query repository for semantic search
    const semanticMatches =
      await this.graphQueryRepository.findRelevantEntities(
        query,
        communityIds,
        options?.maxResults || 50,
      );

    allMatches.push(...semanticMatches);

    // Also do direct entity search within communities
    for (const communityId of communityIds) {
      const communityEntities =
        await this.entityRepository.findByCommunityId(communityId);

      // Filter entities by type if specified
      let filteredEntities = communityEntities;
      if (options?.entityTypes && options.entityTypes.length > 0) {
        filteredEntities = communityEntities.filter((entity) =>
          options.entityTypes!.includes(entity.type),
        );
      }

      // Search entities by name
      const nameMatches = await this.searchEntitiesByName(
        query,
        filteredEntities,
      );
      allMatches.push(...nameMatches);
    }

    // Remove duplicates and apply confidence threshold
    const uniqueMatches = this.removeDuplicateEntityMatches(allMatches);
    const confidenceThreshold = options?.confidenceThreshold || 0.3;

    return uniqueMatches
      .filter((match) => match.relevanceScore >= confidenceThreshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, options?.maxResults || 20);
  }

  private async findRelatedConcepts(
    entityIds: string[],
    communityIds: string[],
    maxHops: number,
  ): Promise<Entity[]> {
    if (entityIds.length === 0) return [];

    const conceptGraph = await this.graphQueryRepository.findRelatedConcepts(
      entityIds,
      maxHops,
      communityIds,
    );

    return conceptGraph.entities;
  }

  private async getRelevantRelationships(
    entities: Entity[],
    relationshipTypes?: string[],
  ): Promise<Relationship[]> {
    const entityIds = entities.map((e) => e.id);
    const relationships: Relationship[] = [];

    for (const entityId of entityIds) {
      const entityRelationships =
        await this.relationshipRepository.findByEntityId(entityId);

      // Filter by relationship types if specified
      let filteredRelationships = entityRelationships;
      if (relationshipTypes && relationshipTypes.length > 0) {
        filteredRelationships = entityRelationships.filter((rel) =>
          relationshipTypes.includes(rel.type),
        );
      }

      // Only include relationships between entities in our result set
      const relevantRelationships = filteredRelationships.filter(
        (rel) =>
          entityIds.includes(rel.sourceId) && entityIds.includes(rel.targetId),
      );

      relationships.push(...relevantRelationships);
    }

    // Remove duplicates
    return this.removeDuplicateRelationships(relationships);
  }

  private async buildTopicSubgraph(
    topic: string,
    communityIds: string[],
    maxEntities: number,
  ): Promise<TopicSubgraph> {
    return await this.graphQueryRepository.getTopicSubgraph(
      topic,
      communityIds,
      maxEntities,
    );
  }

  private async calculateCommunityRelevance(
    query: string,
    communities: Community[],
  ): Promise<CommunityMatch[]> {
    const matches: CommunityMatch[] = [];
    const queryTerms = this.extractQueryTerms(query);

    for (const community of communities) {
      const relevanceScore = this.calculateCommunityRelevanceScore(
        community,
        queryTerms,
      );
      const matchingTopics = this.findMatchingTopics(community, queryTerms);
      const matchingEntities = await this.findMatchingEntityNames(
        community,
        queryTerms,
      );

      if (relevanceScore > 0) {
        matches.push({
          community,
          relevanceScore,
          matchingTopics,
          matchingEntities,
        });
      }
    }

    return matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async searchEntitiesByName(
    query: string,
    entities: Entity[],
  ): Promise<EntityMatch[]> {
    const queryTerms = this.extractQueryTerms(query);
    const matches: EntityMatch[] = [];

    for (const entity of entities) {
      const relevanceScore = this.calculateEntityRelevanceScore(
        entity,
        queryTerms,
      );

      if (relevanceScore > 0) {
        const matchingAliases = this.findMatchingAliases(entity, queryTerms);
        const contextSnippets = this.generateContextSnippets(
          entity,
          queryTerms,
        );

        matches.push({
          entity,
          relevanceScore,
          matchingAliases,
          contextSnippets,
        });
      }
    }

    return matches;
  }

  private extractQueryTerms(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 2)
      .filter((term) => !this.isStopWord(term));
  }

  private calculateCommunityRelevanceScore(
    community: Community,
    queryTerms: string[],
  ): number {
    let score = 0;

    // Check community name
    const nameWords = community.name.toLowerCase().split(/\s+/);
    const nameMatches = queryTerms.filter((term) =>
      nameWords.some((word) => word.includes(term) || term.includes(word)),
    );
    score += nameMatches.length * 0.4;

    // Check community description
    if (community.description) {
      const descWords = community.description.toLowerCase().split(/\s+/);
      const descMatches = queryTerms.filter((term) =>
        descWords.some((word) => word.includes(term) || term.includes(word)),
      );
      score += descMatches.length * 0.3;
    }

    // Check key topics
    if (community.keyTopics) {
      const topicMatches = queryTerms.filter((term) =>
        community.keyTopics!.some(
          (topic) =>
            topic.toLowerCase().includes(term) ||
            term.includes(topic.toLowerCase()),
        ),
      );
      score += topicMatches.length * 0.3;
    }

    // Normalize score
    return Math.min(1.0, score / queryTerms.length);
  }

  private calculateEntityRelevanceScore(
    entity: Entity,
    queryTerms: string[],
  ): number {
    let score = 0;

    // Check entity name
    const nameWords = entity.name.toLowerCase().split(/\s+/);
    const nameMatches = queryTerms.filter((term) =>
      nameWords.some((word) => word.includes(term) || term.includes(word)),
    );
    score += nameMatches.length * 0.5;

    // Check entity description
    if (entity.description) {
      const descWords = entity.description.toLowerCase().split(/\s+/);
      const descMatches = queryTerms.filter((term) =>
        descWords.some((word) => word.includes(term) || term.includes(word)),
      );
      score += descMatches.length * 0.3;
    }

    // Check aliases
    if (entity.aliases) {
      const aliasMatches = queryTerms.filter((term) =>
        entity.aliases!.some(
          (alias) =>
            alias.toLowerCase().includes(term) ||
            term.includes(alias.toLowerCase()),
        ),
      );
      score += aliasMatches.length * 0.2;
    }

    // Boost score based on entity importance
    score *= 1 + entity.importance * 0.5;

    // Normalize score
    return Math.min(1.0, score / queryTerms.length);
  }

  private findMatchingTopics(
    community: Community,
    queryTerms: string[],
  ): string[] {
    if (!community.keyTopics) return [];

    return community.keyTopics.filter((topic) =>
      queryTerms.some(
        (term) =>
          topic.toLowerCase().includes(term) ||
          term.includes(topic.toLowerCase()),
      ),
    );
  }

  private async findMatchingEntityNames(
    community: Community,
    queryTerms: string[],
  ): Promise<string[]> {
    const entities = await this.entityRepository.findByCommunityId(
      community.id,
    );
    const matchingNames: string[] = [];

    for (const entity of entities) {
      const nameWords = entity.name.toLowerCase().split(/\s+/);
      const hasMatch = queryTerms.some((term) =>
        nameWords.some((word) => word.includes(term) || term.includes(word)),
      );

      if (hasMatch) {
        matchingNames.push(entity.name);
      }
    }

    return matchingNames.slice(0, 10); // Limit to top 10 matches
  }

  private findMatchingAliases(entity: Entity, queryTerms: string[]): string[] {
    if (!entity.aliases) return [];

    return entity.aliases.filter((alias) =>
      queryTerms.some(
        (term) =>
          alias.toLowerCase().includes(term) ||
          term.includes(alias.toLowerCase()),
      ),
    );
  }

  private generateContextSnippets(
    entity: Entity,
    queryTerms: string[],
  ): string[] {
    const snippets: string[] = [];

    // Add entity description as context if it contains query terms
    if (entity.description) {
      const hasMatch = queryTerms.some((term) =>
        entity.description!.toLowerCase().includes(term),
      );
      if (hasMatch) {
        snippets.push(entity.description);
      }
    }

    // Add entity name as context
    snippets.push(`Entity: ${entity.name} (${entity.type})`);

    return snippets.slice(0, 3); // Limit to 3 snippets
  }

  private removeDuplicateEntityMatches(matches: EntityMatch[]): EntityMatch[] {
    const seen = new Set<string>();
    return matches.filter((match) => {
      const key = match.entity.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private removeDuplicateRelationships(
    relationships: Relationship[],
  ): Relationship[] {
    const seen = new Set<string>();
    return relationships.filter((rel) => {
      const key = `${rel.sourceId}_${rel.targetId}_${rel.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private calculateAverageRelevance(
    communityMatches: CommunityMatch[],
    entityMatches: EntityMatch[],
  ): number {
    const allScores = [
      ...communityMatches.map((m) => m.relevanceScore),
      ...entityMatches.map((m) => m.relevanceScore),
    ];

    if (allScores.length === 0) return 0;

    return allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
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
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'must',
      'shall',
      'this',
      'that',
      'these',
      'those',
      'a',
      'an',
    ]);
    return stopWords.has(word.toLowerCase());
  }
}
