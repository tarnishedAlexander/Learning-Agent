import { Injectable } from '@nestjs/common';
import type { CommunityRepository } from '../../domain/repositories/community.repository';
import type { EntityRepository } from '../../domain/repositories/entity.repository';
import type {
  GraphQueryRepository,
  CommunityMatch,
  TopicSubgraph,
} from '../../domain/repositories/graph-query.repository';
import { Community } from '../../domain/entities/community.entity';
import { Entity } from '../../domain/entities/entity.entity';

export interface QueryRoutingRequest {
  query: string;
  context?: QueryContext;
  options?: RoutingOptions;
}

export interface QueryContext {
  domain?: string;
  documentType?: string;
  userRole?: string;
  previousQueries?: string[];
  courseId?: string;
  subjectArea?: string;
}

export interface RoutingOptions {
  maxCommunities?: number;
  confidenceThreshold?: number;
  includeRelatedConcepts?: boolean;
  preferSpecificCommunities?: string[];
  excludeCommunities?: string[];
}

export interface RoutingResult {
  originalQuery: string;
  processedQuery: string;
  relevantCommunities: CommunityMatch[];
  recommendedCommunity: Community | null;
  keyEntities: Entity[];
  topicSubgraph?: TopicSubgraph;
  routingConfidence: number;
  routingReason: string;
  suggestedRefinements: string[];
  metadata: {
    processingTimeMs: number;
    queryComplexity: 'simple' | 'moderate' | 'complex';
    domainSpecificity: number;
    communityOverlap: number;
  };
}

@Injectable()
export class IntelligentRoutingService {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly entityRepository: EntityRepository,
    private readonly graphQueryRepository: GraphQueryRepository,
  ) {}

  async routeQuery(request: QueryRoutingRequest): Promise<RoutingResult> {
    const startTime = Date.now();

    try {
      // Step 1: Preprocess and analyze the query
      const processedQuery = await this.preprocessQuery(
        request.query,
        request.context,
      );
      const queryAnalysis = await this.analyzeQuery(
        processedQuery,
        request.context,
      );

      // Step 2: Find relevant communities
      const relevantCommunities = await this.findRelevantCommunities(
        processedQuery,
        request.options,
        request.context,
      );

      // Step 3: Select the best community
      const recommendedCommunity = await this.selectBestCommunity(
        relevantCommunities,
        queryAnalysis,
        request.context,
      );

      // Step 4: Extract key entities from the recommended community
      const keyEntities = await this.extractKeyEntities(
        processedQuery,
        recommendedCommunity,
        request.options?.includeRelatedConcepts,
      );

      // Step 5: Build topic subgraph if needed
      let topicSubgraph: TopicSubgraph | undefined;
      if (recommendedCommunity && queryAnalysis.complexity !== 'simple') {
        topicSubgraph = await this.buildTopicSubgraph(
          processedQuery,
          recommendedCommunity.id,
          queryAnalysis.extractedTopics,
        );
      }

      // Step 6: Calculate routing confidence and generate explanations
      const routingConfidence = this.calculateRoutingConfidence(
        relevantCommunities,
        recommendedCommunity,
        queryAnalysis,
      );

      const routingReason = this.generateRoutingReason(
        recommendedCommunity,
        relevantCommunities,
        queryAnalysis,
      );

      const suggestedRefinements = this.generateQueryRefinements(
        processedQuery,
        relevantCommunities,
        queryAnalysis,
      );

      const processingTime = Date.now() - startTime;

      return {
        originalQuery: request.query,
        processedQuery,
        relevantCommunities,
        recommendedCommunity,
        keyEntities,
        topicSubgraph,
        routingConfidence,
        routingReason,
        suggestedRefinements,
        metadata: {
          processingTimeMs: processingTime,
          queryComplexity: queryAnalysis.complexity,
          domainSpecificity: queryAnalysis.domainSpecificity,
          communityOverlap: this.calculateCommunityOverlap(relevantCommunities),
        },
      };
    } catch (error) {
      throw new Error(`Query routing failed: ${error.message}`);
    }
  }

  /**
   * Routes a query specifically for exam generation
   */
  async routeForExamGeneration(
    subject: string,
    difficulty: string,
    context?: QueryContext,
  ): Promise<RoutingResult> {
    const examQuery = `generate exam questions for ${subject} at ${difficulty} level`;

    return this.routeQuery({
      query: examQuery,
      context: {
        ...context,
        domain: 'education',
        documentType: 'exam',
        subjectArea: subject,
      },
      options: {
        maxCommunities: 3,
        confidenceThreshold: 0.6,
        includeRelatedConcepts: true,
      },
    });
  }

  /**
   * Routes a query for document search and retrieval
   */
  async routeForDocumentSearch(
    searchQuery: string,
    documentType?: string,
    context?: QueryContext,
  ): Promise<RoutingResult> {
    return this.routeQuery({
      query: searchQuery,
      context: {
        ...context,
        documentType,
      },
      options: {
        maxCommunities: 5,
        confidenceThreshold: 0.4,
        includeRelatedConcepts: false,
      },
    });
  }

  private async preprocessQuery(
    query: string,
    context?: QueryContext,
  ): Promise<string> {
    let processedQuery = query.toLowerCase().trim();

    // Remove common stop words but keep domain-specific terms
    processedQuery = this.removeStopWords(processedQuery);

    // Expand abbreviations and acronyms
    processedQuery = this.expandAbbreviations(processedQuery, context?.domain);

    // Add context-specific terms
    if (context?.subjectArea) {
      processedQuery = `${context.subjectArea} ${processedQuery}`;
    }

    // Normalize technical terms
    processedQuery = this.normalizeTechnicalTerms(processedQuery);

    return processedQuery;
  }

  private async analyzeQuery(
    query: string,
    context?: QueryContext,
  ): Promise<QueryAnalysis> {
    const words = query.split(/\s+/);
    const complexity = this.determineQueryComplexity(words);
    const extractedTopics = this.extractTopics(query);
    const domainSpecificity = this.calculateDomainSpecificity(
      query,
      context?.domain,
    );
    const intent = this.classifyQueryIntent(query);

    return {
      complexity,
      extractedTopics,
      domainSpecificity,
      intent,
      wordCount: words.length,
      technicalTerms: this.extractTechnicalTerms(query),
    };
  }

  private async findRelevantCommunities(
    query: string,
    options?: RoutingOptions,
    context?: QueryContext,
  ): Promise<CommunityMatch[]> {
    const maxCommunities = options?.maxCommunities || 5;
    const confidenceThreshold = options?.confidenceThreshold || 0.3;

    // Get communities using graph query repository
    let communities = await this.graphQueryRepository.findRelevantCommunities(
      query,
      maxCommunities * 2, // Get more initially for filtering
    );

    // Apply confidence threshold
    communities = communities.filter(
      (c) => c.relevanceScore >= confidenceThreshold,
    );

    // Apply community preferences
    if (options?.preferSpecificCommunities) {
      communities = this.applyPreferences(
        communities,
        options.preferSpecificCommunities,
      );
    }

    // Exclude specified communities
    if (options?.excludeCommunities) {
      communities = communities.filter(
        (c) => !options.excludeCommunities!.includes(c.community.id),
      );
    }

    // Apply context-based filtering
    if (context) {
      communities = this.applyContextFiltering(communities, context);
    }

    return communities.slice(0, maxCommunities);
  }

  private async selectBestCommunity(
    communities: CommunityMatch[],
    queryAnalysis: QueryAnalysis,
    context?: QueryContext,
  ): Promise<Community | null> {
    if (communities.length === 0) return null;

    // Score communities based on multiple factors
    const scoredCommunities = communities.map((communityMatch) => {
      let score = communityMatch.relevanceScore;

      // Boost score for domain alignment
      if (
        context?.domain &&
        this.isDomainAligned(communityMatch.community, context.domain)
      ) {
        score += 0.2;
      }

      // Boost score for query complexity alignment
      if (
        queryAnalysis.complexity === 'complex' &&
        communityMatch.community.entityCount > 20
      ) {
        score += 0.1;
      }

      // Boost score for topic matching
      const topicMatchScore = this.calculateTopicMatchScore(
        communityMatch.community,
        queryAnalysis.extractedTopics,
      );
      score += topicMatchScore * 0.3;

      // Boost score for community completeness
      const completenessScore = this.calculateCompletenessScore(
        communityMatch.community,
      );
      score += completenessScore * 0.1;

      return {
        community: communityMatch.community,
        finalScore: Math.min(1.0, score),
      };
    });

    // Sort by final score and return the best one
    scoredCommunities.sort((a, b) => b.finalScore - a.finalScore);
    return scoredCommunities[0]?.community || null;
  }

  private async extractKeyEntities(
    query: string,
    community: Community | null,
    includeRelated: boolean = false,
  ): Promise<Entity[]> {
    if (!community) return [];

    // Get entities from the community
    const communityEntities = await this.entityRepository.findByCommunityId(
      community.id,
    );

    // Find entities that match the query
    const matchingEntities = communityEntities.filter((entity) =>
      this.entityMatchesQuery(entity, query),
    );

    // Get top entities by importance
    const topEntities = communityEntities
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);

    // Combine and deduplicate
    const keyEntities = this.deduplicateEntities([
      ...matchingEntities,
      ...topEntities,
    ]);

    // Include related entities if requested
    if (includeRelated && keyEntities.length > 0) {
      const relatedEntityIds =
        await this.graphQueryRepository.findRelatedConcepts(
          keyEntities.map((e) => e.id),
          2, // max hops
          [community.id],
        );

      const relatedEntities = relatedEntityIds.entities.slice(0, 5);
      keyEntities.push(...relatedEntities);
    }

    return keyEntities.slice(0, 15); // Limit to 15 key entities
  }

  private async buildTopicSubgraph(
    query: string,
    communityId: string,
    topics: string[],
  ): Promise<TopicSubgraph> {
    // Use the main topic from the query or the first extracted topic
    const mainTopic = topics.length > 0 ? topics[0] : query;

    return await this.graphQueryRepository.getTopicSubgraph(
      mainTopic,
      [communityId],
      30, // max entities
    );
  }

  private calculateRoutingConfidence(
    communities: CommunityMatch[],
    selectedCommunity: Community | null,
    queryAnalysis: QueryAnalysis,
  ): number {
    if (!selectedCommunity || communities.length === 0) return 0;

    const selectedMatch = communities.find(
      (c) => c.community.id === selectedCommunity.id,
    );
    if (!selectedMatch) return 0;

    let confidence = selectedMatch.relevanceScore;

    // Boost confidence if there's a clear winner
    if (communities.length > 1) {
      const secondBest = communities[1];
      const gap = selectedMatch.relevanceScore - secondBest.relevanceScore;
      if (gap > 0.3) confidence += 0.1;
    }

    // Adjust based on query complexity
    if (queryAnalysis.complexity === 'simple' && confidence > 0.7) {
      confidence += 0.1;
    }

    // Adjust based on domain specificity
    confidence += queryAnalysis.domainSpecificity * 0.1;

    return Math.min(1.0, confidence);
  }

  private generateRoutingReason(
    selectedCommunity: Community | null,
    communities: CommunityMatch[],
    queryAnalysis: QueryAnalysis,
  ): string {
    if (!selectedCommunity) {
      return 'No suitable community found for this query. Consider refining your search terms.';
    }

    const selectedMatch = communities.find(
      (c) => c.community.id === selectedCommunity.id,
    );
    if (!selectedMatch) {
      return 'Community selected based on general relevance.';
    }

    const reasons: string[] = [];

    // Add relevance reason
    if (selectedMatch.relevanceScore > 0.8) {
      reasons.push('high relevance score');
    } else if (selectedMatch.relevanceScore > 0.6) {
      reasons.push('good relevance score');
    }

    // Add topic matching reason
    if (selectedMatch.matchingTopics.length > 0) {
      reasons.push(
        `matches topics: ${selectedMatch.matchingTopics.slice(0, 3).join(', ')}`,
      );
    }

    // Add entity matching reason
    if (selectedMatch.matchingEntities.length > 0) {
      reasons.push(
        `contains relevant entities: ${selectedMatch.matchingEntities.slice(0, 3).join(', ')}`,
      );
    }

    // Add community size reason
    if (selectedCommunity.entityCount > 20) {
      reasons.push('comprehensive knowledge base');
    }

    const reasonText =
      reasons.length > 0
        ? `Selected "${selectedCommunity.name}" because of ${reasons.join(', ')}.`
        : `Selected "${selectedCommunity.name}" as the most relevant community.`;

    return reasonText;
  }

  private generateQueryRefinements(
    query: string,
    communities: CommunityMatch[],
    queryAnalysis: QueryAnalysis,
  ): string[] {
    const refinements: string[] = [];

    // Suggest more specific terms
    if (queryAnalysis.complexity === 'simple') {
      refinements.push('Try adding more specific technical terms');
      refinements.push("Include the context or domain you're interested in");
    }

    // Suggest community-specific refinements
    if (communities.length > 1) {
      const topCommunities = communities.slice(0, 3);
      refinements.push(
        `Consider focusing on: ${topCommunities.map((c) => c.community.name).join(', ')}`,
      );
    }

    // Suggest topic-based refinements
    if (queryAnalysis.extractedTopics.length > 0) {
      refinements.push(
        `Related topics you might explore: ${queryAnalysis.extractedTopics.slice(0, 3).join(', ')}`,
      );
    }

    // Suggest expanding the query
    if (communities.length === 0) {
      refinements.push('Try using broader or alternative terms');
      refinements.push('Check spelling and try synonyms');
    }

    return refinements.slice(0, 5);
  }

  // Helper methods
  private removeStopWords(query: string): string {
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

    return query
      .split(/\s+/)
      .filter((word) => !stopWords.has(word.toLowerCase()))
      .join(' ');
  }

  private expandAbbreviations(query: string, domain?: string): string {
    const abbreviations: Record<string, string> = {
      db: 'database',
      ai: 'artificial intelligence',
      ml: 'machine learning',
      api: 'application programming interface',
      ui: 'user interface',
      ux: 'user experience',
      sql: 'structured query language',
      html: 'hypertext markup language',
      css: 'cascading style sheets',
      js: 'javascript',
    };

    // Add domain-specific abbreviations
    if (domain === 'database') {
      Object.assign(abbreviations, {
        rdbms: 'relational database management system',
        nosql: 'not only sql',
        crud: 'create read update delete',
      });
    }

    let expandedQuery = query;
    for (const [abbr, expansion] of Object.entries(abbreviations)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      expandedQuery = expandedQuery.replace(regex, expansion);
    }

    return expandedQuery;
  }

  private normalizeTechnicalTerms(query: string): string {
    // Normalize common technical term variations
    const normalizations: Record<string, string> = {
      javascript: 'javascript',
      'java script': 'javascript',
      'node.js': 'nodejs',
      'node js': 'nodejs',
      'c++': 'cpp',
      'c sharp': 'csharp',
      'c#': 'csharp',
    };

    let normalizedQuery = query;
    for (const [variant, normalized] of Object.entries(normalizations)) {
      const regex = new RegExp(variant, 'gi');
      normalizedQuery = normalizedQuery.replace(regex, normalized);
    }

    return normalizedQuery;
  }

  private determineQueryComplexity(
    words: string[],
  ): 'simple' | 'moderate' | 'complex' {
    if (words.length <= 3) return 'simple';
    if (words.length <= 7) return 'moderate';
    return 'complex';
  }

  private extractTopics(query: string): string[] {
    // Simple topic extraction - in a real implementation, this would be more sophisticated
    const technicalTerms = this.extractTechnicalTerms(query);
    const importantWords = query
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .filter((word) => !this.isCommonWord(word));

    return [...technicalTerms, ...importantWords].slice(0, 5);
  }

  private extractTechnicalTerms(query: string): string[] {
    const technicalPatterns = [
      /\b(?:algorithm|data structure|database|programming|software|system|network|security)\b/gi,
      /\b(?:javascript|python|java|react|angular|node|sql|html|css)\b/gi,
      /\b(?:machine learning|artificial intelligence|deep learning|neural network)\b/gi,
    ];

    const terms: string[] = [];
    for (const pattern of technicalPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        terms.push(...matches.map((m) => m.toLowerCase()));
      }
    }

    return [...new Set(terms)];
  }

  private calculateDomainSpecificity(query: string, domain?: string): number {
    if (!domain) return 0.5;

    const domainTerms: Record<string, string[]> = {
      database: [
        'database',
        'sql',
        'table',
        'query',
        'index',
        'relation',
        'schema',
      ],
      programming: [
        'code',
        'function',
        'class',
        'variable',
        'method',
        'algorithm',
      ],
      'machine-learning': [
        'model',
        'training',
        'neural',
        'learning',
        'prediction',
        'classification',
      ],
    };

    const terms = domainTerms[domain] || [];
    const queryWords = query.toLowerCase().split(/\s+/);
    const matchCount = queryWords.filter((word) => terms.includes(word)).length;

    return Math.min(1.0, matchCount / Math.max(1, terms.length));
  }

  private classifyQueryIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();

    if (/\b(?:generate|create|make|build)\b/.test(lowerQuery)) {
      return 'generation';
    }
    if (/\b(?:find|search|look|get|retrieve)\b/.test(lowerQuery)) {
      return 'search';
    }
    if (/\b(?:explain|what|how|why|define)\b/.test(lowerQuery)) {
      return 'explanation';
    }
    if (/\b(?:compare|difference|versus|vs)\b/.test(lowerQuery)) {
      return 'comparison';
    }

    return 'general';
  }

  private applyPreferences(
    communities: CommunityMatch[],
    preferredIds: string[],
  ): CommunityMatch[] {
    // Boost scores for preferred communities
    return communities.map((match) => {
      if (preferredIds.includes(match.community.id)) {
        return {
          ...match,
          relevanceScore: Math.min(1.0, match.relevanceScore + 0.2),
        };
      }
      return match;
    });
  }

  private applyContextFiltering(
    communities: CommunityMatch[],
    context: QueryContext,
  ): CommunityMatch[] {
    return communities.filter((match) => {
      // Filter based on context criteria
      if (
        context.domain &&
        !this.isDomainAligned(match.community, context.domain)
      ) {
        return false;
      }
      return true;
    });
  }

  private isDomainAligned(community: Community, domain: string): boolean {
    const communityName = community.name.toLowerCase();
    const communityTopics = (community.keyTopics || []).join(' ').toLowerCase();
    const domainKeywords = this.getDomainKeywords(domain);

    return domainKeywords.some(
      (keyword) =>
        communityName.includes(keyword) || communityTopics.includes(keyword),
    );
  }

  private getDomainKeywords(domain: string): string[] {
    const domainKeywords: Record<string, string[]> = {
      database: ['database', 'sql', 'data', 'table', 'query'],
      programming: ['programming', 'code', 'software', 'development'],
      'machine-learning': ['machine learning', 'ai', 'model', 'algorithm'],
      web: ['web', 'html', 'css', 'javascript', 'frontend', 'backend'],
    };

    return domainKeywords[domain.toLowerCase()] || [];
  }

  private calculateTopicMatchScore(
    community: Community,
    topics: string[],
  ): number {
    if (!community.keyTopics || topics.length === 0) return 0;

    const communityTopics = community.keyTopics.map((t) => t.toLowerCase());
    const queryTopics = topics.map((t) => t.toLowerCase());

    const matches = queryTopics.filter((topic) =>
      communityTopics.some(
        (cTopic) => cTopic.includes(topic) || topic.includes(cTopic),
      ),
    );

    return matches.length / Math.max(1, topics.length);
  }

  private calculateCompletenessScore(community: Community): number {
    // Score based on community size and relationship density
    const entityScore = Math.min(1.0, community.entityCount / 50);
    const relationshipScore = Math.min(1.0, community.relationshipCount / 100);
    const summaryScore = community.hasSummary() ? 0.2 : 0;

    return entityScore * 0.4 + relationshipScore * 0.4 + summaryScore;
  }

  private entityMatchesQuery(entity: Entity, query: string): boolean {
    const queryWords = query.toLowerCase().split(/\s+/);
    const entityName = entity.name.toLowerCase();
    const entityDesc = (entity.description || '').toLowerCase();

    return queryWords.some(
      (word) =>
        entityName.includes(word) ||
        entityDesc.includes(word) ||
        (entity.aliases || []).some((alias) =>
          alias.toLowerCase().includes(word),
        ),
    );
  }

  private deduplicateEntities(entities: Entity[]): Entity[] {
    const seen = new Set<string>();
    return entities.filter((entity) => {
      if (seen.has(entity.id)) {
        return false;
      }
      seen.add(entity.id);
      return true;
    });
  }

  private calculateCommunityOverlap(communities: CommunityMatch[]): number {
    if (communities.length < 2) return 0;

    // Calculate average overlap between top communities
    let totalOverlap = 0;
    let comparisons = 0;

    for (let i = 0; i < Math.min(3, communities.length); i++) {
      for (let j = i + 1; j < Math.min(3, communities.length); j++) {
        const overlap = this.calculateSingleCommunityOverlap(
          communities[i],
          communities[j],
        );
        totalOverlap += overlap;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalOverlap / comparisons : 0;
  }

  private calculateSingleCommunityOverlap(
    community1: CommunityMatch,
    community2: CommunityMatch,
  ): number {
    const topics1 = new Set(community1.matchingTopics);
    const topics2 = new Set(community2.matchingTopics);

    const intersection = new Set([...topics1].filter((x) => topics2.has(x)));
    const union = new Set([...topics1, ...topics2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'system',
      'method',
      'process',
      'approach',
      'technique',
      'concept',
      'model',
      'framework',
      'structure',
      'design',
      'implementation',
    ]);
    return commonWords.has(word.toLowerCase());
  }
}

interface QueryAnalysis {
  complexity: 'simple' | 'moderate' | 'complex';
  extractedTopics: string[];
  domainSpecificity: number;
  intent: QueryIntent;
  wordCount: number;
  technicalTerms: string[];
}

type QueryIntent =
  | 'generation'
  | 'search'
  | 'explanation'
  | 'comparison'
  | 'general';
