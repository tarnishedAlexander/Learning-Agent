export class Community {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly level: number = 0,
    public readonly parentId?: string,
    public readonly documentCount: number = 0,
    public readonly entityCount: number = 0,
    public readonly relationshipCount: number = 0,
    public readonly globalSummary?: string,
    public readonly keyTopics?: string[],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    name: string,
    description?: string,
    level: number = 0,
    parentId?: string,
  ): Community {
    return new Community(
      id,
      name,
      description,
      level,
      parentId,
      0, // documentCount
      0, // entityCount
      0, // relationshipCount
      undefined, // globalSummary
      undefined, // keyTopics
    );
  }

  /**
   * Updates the community with new metadata counts
   */
  withUpdatedCounts(
    documentCount: number,
    entityCount: number,
    relationshipCount: number,
  ): Community {
    return new Community(
      this.id,
      this.name,
      this.description,
      this.level,
      this.parentId,
      documentCount,
      entityCount,
      relationshipCount,
      this.globalSummary,
      this.keyTopics,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Updates the community with a global summary and key topics
   */
  withSummary(globalSummary: string, keyTopics: string[]): Community {
    return new Community(
      this.id,
      this.name,
      this.description,
      this.level,
      this.parentId,
      this.documentCount,
      this.entityCount,
      this.relationshipCount,
      globalSummary,
      keyTopics,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Updates the community description
   */
  withDescription(description: string): Community {
    return new Community(
      this.id,
      this.name,
      description,
      this.level,
      this.parentId,
      this.documentCount,
      this.entityCount,
      this.relationshipCount,
      this.globalSummary,
      this.keyTopics,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Checks if this is a root community (no parent)
   */
  isRoot(): boolean {
    return !this.parentId;
  }

  /**
   * Checks if this community has a summary
   */
  hasSummary(): boolean {
    return Boolean(this.globalSummary && this.globalSummary.trim().length > 0);
  }

  /**
   * Checks if this community has key topics
   */
  hasKeyTopics(): boolean {
    return Boolean(this.keyTopics && this.keyTopics.length > 0);
  }

  /**
   * Gets the community size based on entity and relationship counts
   */
  getSize(): number {
    return this.entityCount + this.relationshipCount;
  }

  /**
   * Checks if this community is empty (no entities or relationships)
   */
  isEmpty(): boolean {
    return this.entityCount === 0 && this.relationshipCount === 0;
  }
}
