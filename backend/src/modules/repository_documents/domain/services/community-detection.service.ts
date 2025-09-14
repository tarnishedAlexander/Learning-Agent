import { Entity } from '../entities/entity.entity';
import { Relationship } from '../entities/relationship.entity';
import { Community } from '../entities/community.entity';

export interface CommunityDetectionService {
  /**
   * Detects communities from a set of entities and relationships
   */
  detectCommunities(
    entities: Entity[],
    relationships: Relationship[],
    options?: CommunityDetectionOptions,
  ): Promise<DetectedCommunity[]>;

  /**
   * Assigns entities to existing communities based on similarity
   */
  assignToCommunities(
    entities: Entity[],
    existingCommunities: Community[],
    threshold?: number,
  ): Promise<CommunityAssignment[]>;

  /**
   * Merges similar communities
   */
  mergeSimilarCommunities(
    communities: Community[],
    similarityThreshold?: number,
  ): Promise<CommunityMergeResult[]>;

  /**
   * Splits large communities into smaller ones
   */
  splitLargeCommunities(
    community: Community,
    entities: Entity[],
    relationships: Relationship[],
    maxSize?: number,
  ): Promise<Community[]>;

  /**
   * Calculates similarity between two communities
   */
  calculateCommunitySimilarity(
    community1: Community,
    community2: Community,
    entities1: Entity[],
    entities2: Entity[],
  ): Promise<number>;

  /**
   * Optimizes community structure using modularity
   */
  optimizeCommunityStructure(
    entities: Entity[],
    relationships: Relationship[],
    currentCommunities: Community[],
  ): Promise<CommunityOptimizationResult>;

  /**
   * Validates community quality
   */
  validateCommunityQuality(
    community: Community,
    entities: Entity[],
    relationships: Relationship[],
  ): Promise<CommunityQualityMetrics>;

  /**
   * Suggests community names based on entities
   */
  suggestCommunityName(
    entities: Entity[],
    relationships: Relationship[],
  ): Promise<string[]>;

  /**
   * Detects hierarchical community structure
   */
  detectHierarchicalCommunities(
    entities: Entity[],
    relationships: Relationship[],
    maxLevels?: number,
  ): Promise<HierarchicalCommunity[]>;
}

export interface CommunityDetectionOptions {
  algorithm?: 'leiden' | 'louvain' | 'label_propagation' | 'modularity';
  resolution?: number;
  minCommunitySize?: number;
  maxCommunitySize?: number;
  randomSeed?: number;
  iterations?: number;
}

export interface DetectedCommunity {
  id: string;
  name: string;
  entities: Entity[];
  relationships: Relationship[];
  quality: number;
  suggestedName: string;
  keyTopics: string[];
  description?: string;
}

export interface CommunityAssignment {
  entityId: string;
  communityId: string;
  confidence: number;
  reasons: string[];
}

export interface CommunityMergeResult {
  mergedCommunityId: string;
  originalCommunityIds: string[];
  mergedName: string;
  qualityImprovement: number;
  reason: string;
}

export interface CommunityOptimizationResult {
  optimizedCommunities: Community[];
  qualityImprovement: number;
  modularityScore: number;
  changes: Array<{
    type: 'merge' | 'split' | 'reassign';
    details: any;
  }>;
}

export interface CommunityQualityMetrics {
  modularity: number;
  conductance: number;
  density: number;
  cohesion: number;
  separation: number;
  silhouetteScore: number;
  isValid: boolean;
  issues: string[];
}

export interface HierarchicalCommunity {
  id: string;
  name: string;
  level: number;
  parentId?: string;
  children: HierarchicalCommunity[];
  entities: Entity[];
  quality: number;
}
