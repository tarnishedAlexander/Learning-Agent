import { Entity } from '../entities/entity.entity';
import { Relationship } from '../entities/relationship.entity';
import { Community } from '../entities/community.entity';

export interface GraphAnalysisService {
  /**
   * Analyzes the overall structure of a knowledge graph
   */
  analyzeGraphStructure(
    entities: Entity[],
    relationships: Relationship[],
  ): Promise<GraphStructureAnalysis>;

  /**
   * Calculates centrality measures for entities
   */
  calculateCentralityMeasures(
    entities: Entity[],
    relationships: Relationship[],
  ): Promise<CentralityMeasures[]>;

  /**
   * Identifies key entities in the graph
   */
  identifyKeyEntities(
    entities: Entity[],
    relationships: Relationship[],
    criteria?: KeyEntityCriteria,
  ): Promise<KeyEntity[]>;

  /**
   * Analyzes community cohesion and separation
   */
  analyzeCommunityStructure(
    community: Community,
    entities: Entity[],
    relationships: Relationship[],
  ): Promise<CommunityAnalysis>;

  /**
   * Finds knowledge gaps and missing connections
   */
  findKnowledgeGaps(
    entities: Entity[],
    relationships: Relationship[],
    expectedConnections?: ExpectedConnection[],
  ): Promise<KnowledgeGap[]>;

  /**
   * Calculates graph metrics and statistics
   */
  calculateGraphMetrics(
    entities: Entity[],
    relationships: Relationship[],
  ): Promise<GraphMetrics>;

  /**
   * Identifies clusters and subgraphs
   */
  identifyClusters(
    entities: Entity[],
    relationships: Relationship[],
    algorithm?: ClusteringAlgorithm,
  ): Promise<GraphCluster[]>;

  /**
   * Analyzes information flow in the graph
   */
  analyzeInformationFlow(
    entities: Entity[],
    relationships: Relationship[],
    sourceEntities: string[],
  ): Promise<InformationFlowAnalysis>;

  /**
   * Detects anomalies in the graph structure
   */
  detectAnomalies(
    entities: Entity[],
    relationships: Relationship[],
  ): Promise<GraphAnomaly[]>;

  /**
   * Calculates similarity between entities
   */
  calculateEntitySimilarity(
    entity1: Entity,
    entity2: Entity,
    relationships: Relationship[],
    method?: SimilarityMethod,
  ): Promise<number>;

  /**
   * Finds the shortest paths between entities
   */
  findShortestPaths(
    entities: Entity[],
    relationships: Relationship[],
    sourceId: string,
    targetId: string,
  ): Promise<GraphPath[]>;

  /**
   * Analyzes the evolution of the graph over time
   */
  analyzeGraphEvolution(
    snapshots: GraphSnapshot[],
  ): Promise<GraphEvolutionAnalysis>;
}

export interface GraphStructureAnalysis {
  nodeCount: number;
  edgeCount: number;
  density: number;
  averageDegree: number;
  diameter: number;
  radius: number;
  clusteringCoefficient: number;
  connectedComponents: number;
  stronglyConnectedComponents: number;
  isConnected: boolean;
  isDirected: boolean;
  hasCycles: boolean;
  topologicalComplexity: number;
}

export interface CentralityMeasures {
  entityId: string;
  degreeCentrality: number;
  betweennessCentrality: number;
  closenessCentrality: number;
  eigenvectorCentrality: number;
  pageRank: number;
  katzCentrality: number;
}

export interface KeyEntityCriteria {
  minCentralityScore?: number;
  minConnections?: number;
  entityTypes?: string[];
  importanceThreshold?: number;
  frequencyThreshold?: number;
}

export interface KeyEntity {
  entity: Entity;
  keyScore: number;
  reasons: string[];
  centralityMeasures: CentralityMeasures;
  connections: number;
  influence: number;
}

export interface CommunityAnalysis {
  communityId: string;
  cohesion: number;
  separation: number;
  modularity: number;
  conductance: number;
  density: number;
  averagePathLength: number;
  clusteringCoefficient: number;
  centralEntities: string[];
  bridgeEntities: string[];
  isolatedEntities: string[];
  subCommunities: SubCommunity[];
}

export interface SubCommunity {
  entities: string[];
  cohesion: number;
  suggestedName: string;
}

export interface KnowledgeGap {
  type:
    | 'missing_entity'
    | 'missing_relationship'
    | 'weak_connection'
    | 'isolated_entity';
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAction: string;
  affectedEntities: string[];
  evidence: string[];
}

export interface ExpectedConnection {
  sourceEntityType: string;
  targetEntityType: string;
  expectedRelationshipType: string;
  confidence: number;
}

export interface GraphMetrics {
  basic: GraphStructureAnalysis;
  centrality: {
    averageDegreeCentrality: number;
    averageBetweennessCentrality: number;
    averageClosenessCentrality: number;
    centralityDistribution: Record<string, number>;
  };
  connectivity: {
    edgeConnectivity: number;
    vertexConnectivity: number;
    algebraicConnectivity: number;
  };
  efficiency: {
    globalEfficiency: number;
    localEfficiency: number;
    averageEfficiency: number;
  };
  robustness: {
    robustnessIndex: number;
    vulnerableNodes: string[];
    criticalEdges: Array<{ source: string; target: string }>;
  };
}

export interface ClusteringAlgorithm {
  name: 'leiden' | 'louvain' | 'spectral' | 'hierarchical' | 'kmeans';
  parameters?: Record<string, any>;
}

export interface GraphCluster {
  id: string;
  entities: string[];
  relationships: string[];
  cohesion: number;
  size: number;
  suggestedName: string;
  keyEntities: string[];
}

export interface InformationFlowAnalysis {
  flowPaths: FlowPath[];
  bottlenecks: string[];
  informationHubs: string[];
  flowEfficiency: number;
  averagePathLength: number;
  reachability: Record<string, string[]>;
}

export interface FlowPath {
  source: string;
  target: string;
  path: string[];
  strength: number;
  length: number;
}

export interface GraphAnomaly {
  type:
    | 'isolated_node'
    | 'hub_overload'
    | 'weak_cluster'
    | 'bridge_failure'
    | 'cycle_anomaly';
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedNodes: string[];
  suggestedFix: string;
  confidence: number;
}

export interface SimilarityMethod {
  name: 'jaccard' | 'cosine' | 'structural' | 'semantic' | 'hybrid';
  parameters?: Record<string, any>;
}

export interface GraphPath {
  path: string[];
  length: number;
  weight: number;
  relationships: string[];
}

export interface GraphSnapshot {
  timestamp: Date;
  entities: Entity[];
  relationships: Relationship[];
  metadata?: Record<string, any>;
}

export interface GraphEvolutionAnalysis {
  growthRate: number;
  stabilityIndex: number;
  evolutionPatterns: EvolutionPattern[];
  emergingConcepts: string[];
  decliningConcepts: string[];
  structuralChanges: StructuralChange[];
}

export interface EvolutionPattern {
  type: 'growth' | 'decline' | 'merge' | 'split' | 'stable';
  description: string;
  timeRange: { start: Date; end: Date };
  affectedEntities: string[];
  significance: number;
}

export interface StructuralChange {
  type: 'topology' | 'centrality' | 'clustering' | 'connectivity';
  description: string;
  magnitude: number;
  timestamp: Date;
  cause?: string;
}
