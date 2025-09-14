export class Entity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: EntityType,
    public readonly communityId: string,
    public readonly description?: string,
    public readonly frequency: number = 1,
    public readonly importance: number = 0.0,
    public readonly aliases?: string[],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    name: string,
    type: EntityType,
    communityId: string,
    description?: string,
  ): Entity {
    return new Entity(
      id,
      name,
      type,
      communityId,
      description,
      1, // frequency
      0.0, // importance
      undefined, // aliases
    );
  }

  /**
   * Updates the entity frequency (how often it appears)
   */
  withFrequency(frequency: number): Entity {
    return new Entity(
      this.id,
      this.name,
      this.type,
      this.communityId,
      this.description,
      frequency,
      this.importance,
      this.aliases,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Updates the entity importance score
   */
  withImportance(importance: number): Entity {
    return new Entity(
      this.id,
      this.name,
      this.type,
      this.communityId,
      this.description,
      this.frequency,
      importance,
      this.aliases,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Updates the entity description
   */
  withDescription(description: string): Entity {
    return new Entity(
      this.id,
      this.name,
      this.type,
      this.communityId,
      description,
      this.frequency,
      this.importance,
      this.aliases,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Updates the entity aliases
   */
  withAliases(aliases: string[]): Entity {
    return new Entity(
      this.id,
      this.name,
      this.type,
      this.communityId,
      this.description,
      this.frequency,
      this.importance,
      aliases,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Increments the entity frequency
   */
  incrementFrequency(): Entity {
    return this.withFrequency(this.frequency + 1);
  }

  /**
   * Checks if the entity has a description
   */
  hasDescription(): boolean {
    return Boolean(this.description && this.description.trim().length > 0);
  }

  /**
   * Checks if the entity has aliases
   */
  hasAliases(): boolean {
    return Boolean(this.aliases && this.aliases.length > 0);
  }

  /**
   * Checks if the entity is important (above threshold)
   */
  isImportant(threshold: number = 0.5): boolean {
    return this.importance >= threshold;
  }

  /**
   * Checks if the entity is frequently mentioned
   */
  isFrequent(threshold: number = 5): boolean {
    return this.frequency >= threshold;
  }

  /**
   * Gets the entity's display name (name or first alias)
   */
  getDisplayName(): string {
    return this.name;
  }

  /**
   * Checks if a given name matches this entity (including aliases)
   */
  matchesName(name: string): boolean {
    const normalizedName = name.toLowerCase().trim();
    const entityName = this.name.toLowerCase().trim();

    if (entityName === normalizedName) {
      return true;
    }

    if (this.aliases) {
      return this.aliases.some(
        (alias) => alias.toLowerCase().trim() === normalizedName,
      );
    }

    return false;
  }
}

export enum EntityType {
  PERSON = 'PERSON',
  CONCEPT = 'CONCEPT',
  TECHNOLOGY = 'TECHNOLOGY',
  METHODOLOGY = 'METHODOLOGY',
  TOOL = 'TOOL',
  ALGORITHM = 'ALGORITHM',
  DATA_STRUCTURE = 'DATA_STRUCTURE',
  PROGRAMMING_LANGUAGE = 'PROGRAMMING_LANGUAGE',
  FRAMEWORK = 'FRAMEWORK',
  ORGANIZATION = 'ORGANIZATION',
  LOCATION = 'LOCATION',
  FUNCTION = 'FUNCTION',
  CLASS = 'CLASS',
  LIBRARY = 'LIBRARY',
  API = 'API',
  OTHER = 'OTHER',
}
