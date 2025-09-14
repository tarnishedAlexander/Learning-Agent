import { Community } from '../entities/community.entity';

export interface CommunityRepository {
  /**
   * Saves a community to the repository
   */
  save(community: Community): Promise<Community>;

  /**
   * Finds a community by its ID
   */
  findById(id: string): Promise<Community | null>;

  /**
   * Finds a community by its name
   */
  findByName(name: string): Promise<Community | null>;

  /**
   * Finds all communities
   */
  findAll(): Promise<Community[]>;

  /**
   * Finds communities by level (hierarchical)
   */
  findByLevel(level: number): Promise<Community[]>;

  /**
   * Finds child communities of a parent
   */
  findChildren(parentId: string): Promise<Community[]>;

  /**
   * Finds root communities (no parent)
   */
  findRoots(): Promise<Community[]>;

  /**
   * Finds communities that contain a specific document
   */
  findByDocumentId(documentId: string): Promise<Community[]>;

  /**
   * Finds communities by key topics
   */
  findByKeyTopics(topics: string[]): Promise<Community[]>;

  /**
   * Searches communities by name or description
   */
  search(query: string): Promise<Community[]>;

  /**
   * Updates community metadata counts
   */
  updateCounts(
    communityId: string,
    documentCount: number,
    entityCount: number,
    relationshipCount: number,
  ): Promise<Community>;

  /**
   * Updates community summary and key topics
   */
  updateSummary(
    communityId: string,
    globalSummary: string,
    keyTopics: string[],
  ): Promise<Community>;

  /**
   * Deletes a community by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a community exists by name
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * Gets community statistics
   */
  getStatistics(): Promise<CommunityStatistics>;

  /**
   * Finds communities with similar names or topics
   */
  findSimilar(community: Community, limit?: number): Promise<Community[]>;

  /**
   * Bulk saves multiple communities
   */
  bulkSave(communities: Community[]): Promise<Community[]>;
}

export interface CommunityStatistics {
  totalCommunities: number;
  totalDocuments: number;
  totalEntities: number;
  totalRelationships: number;
  averageEntitiesPerCommunity: number;
  averageRelationshipsPerCommunity: number;
  communitiesByLevel: Record<number, number>;
  topCommunitiesBySize: Array<{
    id: string;
    name: string;
    size: number;
  }>;
}
