import {
  Relationship,
  RelationshipType,
} from '../entities/relationship.entity';

export interface RelationshipRepository {
  /**
   * Saves a relationship to the repository
   */
  save(relationship: Relationship): Promise<Relationship>;

  /**
   * Finds a relationship by its ID
   */
  findById(id: string): Promise<Relationship | null>;

  /**
   * Finds relationships by source entity ID
   */
  findBySourceId(sourceId: string): Promise<Relationship[]>;

  /**
   * Finds relationships by target entity ID
   */
  findByTargetId(targetId: string): Promise<Relationship[]>;

  /**
   * Finds relationships involving an entity (as source or target)
   */
  findByEntityId(entityId: string): Promise<Relationship[]>;

  /**
   * Finds relationships by community ID
   */
  findByCommunityId(communityId: string): Promise<Relationship[]>;

  /**
   * Finds relationships by type
   */
  findByType(type: RelationshipType): Promise<Relationship[]>;

  /**
   * Finds relationships by type within a community
   */
  findByTypeAndCommunity(
    type: RelationshipType,
    communityId: string,
  ): Promise<Relationship[]>;

  /**
   * Finds a specific relationship between two entities
   */
  findBetweenEntities(
    sourceId: string,
    targetId: string,
    type?: RelationshipType,
  ): Promise<Relationship[]>;

  /**
   * Finds relationships by strength threshold
   */
  findByStrength(
    minStrength: number,
    communityId?: string,
  ): Promise<Relationship[]>;

  /**
   * Finds the strongest relationships in a community
   */
  findStrongest(communityId: string, limit?: number): Promise<Relationship[]>;

  /**
   * Finds relationships supported by a specific document
   */
  findByDocumentId(documentId: string): Promise<Relationship[]>;

  /**
   * Finds relationships with multiple document sources
   */
  findWellSupported(
    minSources: number,
    communityId?: string,
  ): Promise<Relationship[]>;

  /**
   * Updates relationship strength
   */
  updateStrength(
    relationshipId: string,
    strength: number,
  ): Promise<Relationship>;

  /**
   * Updates relationship description
   */
  updateDescription(
    relationshipId: string,
    description: string,
  ): Promise<Relationship>;

  /**
   * Adds a document source to a relationship
   */
  addDocumentSource(
    relationshipId: string,
    documentId: string,
  ): Promise<Relationship>;

  /**
   * Deletes a relationship by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a relationship exists between two entities
   */
  existsBetweenEntities(
    sourceId: string,
    targetId: string,
    type: RelationshipType,
    communityId: string,
  ): Promise<boolean>;

  /**
   * Gets relationship statistics for a community
   */
  getStatistics(communityId?: string): Promise<RelationshipStatistics>;

  /**
   * Finds the shortest path between two entities
   */
  findShortestPath(sourceId: string, targetId: string): Promise<Relationship[]>;

  /**
   * Finds entities connected to a given entity within N hops
   */
  findConnectedEntities(entityId: string, maxHops: number): Promise<string[]>;

  /**
   * Bulk saves multiple relationships
   */
  bulkSave(relationships: Relationship[]): Promise<Relationship[]>;

  /**
   * Finds bidirectional relationships
   */
  findBidirectional(communityId?: string): Promise<Relationship[]>;

  /**
   * Gets the degree (number of connections) for an entity
   */
  getEntityDegree(entityId: string): Promise<number>;

  /**
   * Finds hub entities (highly connected)
   */
  findHubEntities(
    communityId: string,
    minDegree: number,
  ): Promise<
    Array<{
      entityId: string;
      degree: number;
    }>
  >;
}

export interface RelationshipStatistics {
  totalRelationships: number;
  relationshipsByType: Record<RelationshipType, number>;
  averageStrength: number;
  strongRelationships: number;
  weakRelationships: number;
  bidirectionalRelationships: number;
  averageDocumentSources: number;
  topRelationshipsByStrength: Array<{
    id: string;
    sourceId: string;
    targetId: string;
    type: RelationshipType;
    strength: number;
  }>;
  hubEntities: Array<{
    entityId: string;
    degree: number;
  }>;
}
