import { Entity, EntityType } from '../entities/entity.entity';

export interface EntityRepository {
  /**
   * Saves an entity to the repository
   */
  save(entity: Entity): Promise<Entity>;

  /**
   * Finds an entity by its ID
   */
  findById(id: string): Promise<Entity | null>;

  /**
   * Finds an entity by name and community
   */
  findByNameAndCommunity(
    name: string,
    communityId: string,
  ): Promise<Entity | null>;

  /**
   * Finds entities by community ID
   */
  findByCommunityId(communityId: string): Promise<Entity[]>;

  /**
   * Finds entities by type
   */
  findByType(type: EntityType): Promise<Entity[]>;

  /**
   * Finds entities by type within a community
   */
  findByTypeAndCommunity(
    type: EntityType,
    communityId: string,
  ): Promise<Entity[]>;

  /**
   * Finds entities by importance threshold
   */
  findByImportance(
    minImportance: number,
    communityId?: string,
  ): Promise<Entity[]>;

  /**
   * Finds entities by frequency threshold
   */
  findByFrequency(
    minFrequency: number,
    communityId?: string,
  ): Promise<Entity[]>;

  /**
   * Searches entities by name (including aliases)
   */
  searchByName(query: string, communityId?: string): Promise<Entity[]>;

  /**
   * Finds entities mentioned in a specific document chunk
   */
  findByChunkId(chunkId: string): Promise<Entity[]>;

  /**
   * Finds entities mentioned in a specific document
   */
  findByDocumentId(documentId: string): Promise<Entity[]>;

  /**
   * Finds the most important entities in a community
   */
  findTopEntities(communityId: string, limit?: number): Promise<Entity[]>;

  /**
   * Finds the most frequent entities in a community
   */
  findMostFrequent(communityId: string, limit?: number): Promise<Entity[]>;

  /**
   * Updates entity frequency
   */
  updateFrequency(entityId: string, frequency: number): Promise<Entity>;

  /**
   * Updates entity importance
   */
  updateImportance(entityId: string, importance: number): Promise<Entity>;

  /**
   * Updates entity description
   */
  updateDescription(entityId: string, description: string): Promise<Entity>;

  /**
   * Updates entity aliases
   */
  updateAliases(entityId: string, aliases: string[]): Promise<Entity>;

  /**
   * Deletes an entity by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if an entity exists by name and community
   */
  existsByNameAndCommunity(name: string, communityId: string): Promise<boolean>;

  /**
   * Gets entity statistics for a community
   */
  getStatistics(communityId?: string): Promise<EntityStatistics>;

  /**
   * Finds entities similar to a given entity
   */
  findSimilar(entity: Entity, limit?: number): Promise<Entity[]>;

  /**
   * Bulk saves multiple entities
   */
  bulkSave(entities: Entity[]): Promise<Entity[]>;

  /**
   * Finds entities that co-occur with a given entity
   */
  findCoOccurring(entityId: string, limit?: number): Promise<Entity[]>;

  /**
   * Gets entity mention count in documents
   */
  getMentionCount(entityId: string): Promise<number>;
}

export interface EntityStatistics {
  totalEntities: number;
  entitiesByType: Record<EntityType, number>;
  averageImportance: number;
  averageFrequency: number;
  topEntitiesByImportance: Array<{
    id: string;
    name: string;
    importance: number;
  }>;
  topEntitiesByFrequency: Array<{
    id: string;
    name: string;
    frequency: number;
  }>;
}
