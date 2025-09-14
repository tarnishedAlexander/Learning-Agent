import { Community } from '../entities/community.entity';
import { Entity } from '../entities/entity.entity';
import { Relationship } from '../entities/relationship.entity';

export interface GraphQueryRepository {
  /**
   * Finds communities relevant to a query
   */
  findRelevantCommunities(
    query: string,
    limit?: number,
  ): Promise<CommunityMatch[]>;

  /**
   * Finds entities relevant to a query within specific communities
   */
  findRelevantEntities(
    query: string,
    communityIds?: string[],
    limit?: number,
  ): Promise<EntityMatch[]>;

  /**
   * Performs graph traversal to find related concepts
   */
  findRelatedConcepts(
    entityIds: string[],
    maxHops: number,
    communityIds?: string[],
  ): Promise<ConceptGraph>;

  /**
   * Finds the knowledge subgraph for a specific topic
   */
  getTopicSubgraph(
    topic: string,
    communityIds?: string[],
    maxEntities?: number,
  ): Promise<TopicSubgraph>;

  /**
   * Searches for entities and relationships by semantic similarity
   */
  semanticSearch(
    query: string,
    communityIds?: string[],
    entityTypes?: string[],
    relationshipTypes?: string[],
  ): Promise<SemanticSearchResult>;

  /**
   * Finds communities that best match a document's content
   */
  findBestCommunitiesForDocument(
    documentId: string,
    extractedEntities: string[],
    limit?: number,
  ): Promise<CommunityMatch[]>;

  /**
   * Gets the knowledge graph structure for visualization
   */
  getGraphStructure(
    communityIds?: string[],
    includeWeakRelationships?: boolean,
  ): Promise<GraphStructure>;

  /**
   * Finds knowledge gaps (entities without sufficient relationships)
   */
  findKnowledgeGaps(communityId: string): Promise<KnowledgeGap[]>;

  /**
   * Analyzes the connectivity of a community's knowledge graph
   */
  analyzeConnectivity(communityId: string): Promise<ConnectivityAnalysis>;

  /**
   * Finds overlapping concepts between communities
   */
  findCommunityOverlaps(
    communityId1: string,
    communityId2: string,
  ): Promise<CommunityOverlap>;

  /**
   * Suggests new relationships based on entity co-occurrence
   */
  suggestRelationships(
    communityId: string,
    confidenceThreshold?: number,
  ): Promise<RelationshipSuggestion[]>;

  /**
   * Finds the most central entities in a community (PageRank-like)
   */
  findCentralEntities(
    communityId: string,
    limit?: number,
  ): Promise<CentralEntity[]>;

  /**
   * Gets entity importance scores based on graph structure
   */
  calculateEntityImportance(communityId: string): Promise<EntityImportance[]>;
}

export interface CommunityMatch {
  community: Community;
  relevanceScore: number;
  matchingTopics: string[];
  matchingEntities: string[];
}

export interface EntityMatch {
  entity: Entity;
  relevanceScore: number;
  matchingAliases: string[];
  contextSnippets: string[];
}

export interface ConceptGraph {
  entities: Entity[];
  relationships: Relationship[];
  centralEntity: string;
  maxHops: number;
}

export interface TopicSubgraph {
  topic: string;
  entities: Entity[];
  relationships: Relationship[];
  communities: Community[];
  relevanceScores: Record<string, number>;
}

export interface SemanticSearchResult {
  entities: EntityMatch[];
  relationships: Array<{
    relationship: Relationship;
    relevanceScore: number;
  }>;
  communities: CommunityMatch[];
  totalResults: number;
}

export interface GraphStructure {
  nodes: Array<{
    id: string;
    label: string;
    type: 'entity' | 'community';
    properties: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    weight: number;
    properties: Record<string, any>;
  }>;
  communities: Array<{
    id: string;
    name: string;
    nodeIds: string[];
  }>;
}

export interface KnowledgeGap {
  entity: Entity;
  expectedRelationships: number;
  actualRelationships: number;
  suggestedConnections: string[];
}

export interface ConnectivityAnalysis {
  communityId: string;
  totalEntities: number;
  totalRelationships: number;
  averageDegree: number;
  clusteringCoefficient: number;
  connectedComponents: number;
  diameter: number;
  density: number;
  centralEntities: string[];
  isolatedEntities: string[];
}

export interface CommunityOverlap {
  sharedEntities: Entity[];
  sharedConcepts: string[];
  overlapScore: number;
  suggestedMerge: boolean;
}

export interface RelationshipSuggestion {
  sourceEntityId: string;
  targetEntityId: string;
  suggestedType: string;
  confidence: number;
  evidence: string[];
  coOccurrenceCount: number;
}

export interface CentralEntity {
  entity: Entity;
  centralityScore: number;
  degree: number;
  betweennessCentrality: number;
  closenessCentrality: number;
}

export interface EntityImportance {
  entityId: string;
  importanceScore: number;
  factors: {
    frequency: number;
    connectivity: number;
    centrality: number;
    documentSpread: number;
  };
}
