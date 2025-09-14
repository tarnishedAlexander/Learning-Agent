export class Relationship {
  constructor(
    public readonly id: string,
    public readonly sourceId: string,
    public readonly targetId: string,
    public readonly type: RelationshipType,
    public readonly communityId: string,
    public readonly description?: string,
    public readonly strength: number = 1.0,
    public readonly documentSources?: string[],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    sourceId: string,
    targetId: string,
    type: RelationshipType,
    communityId: string,
    description?: string,
    strength: number = 1.0,
  ): Relationship {
    return new Relationship(
      id,
      sourceId,
      targetId,
      type,
      communityId,
      description,
      strength,
      undefined, // documentSources
    );
  }

  /**
   * Updates the relationship strength
   */
  withStrength(strength: number): Relationship {
    return new Relationship(
      this.id,
      this.sourceId,
      this.targetId,
      this.type,
      this.communityId,
      this.description,
      strength,
      this.documentSources,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Updates the relationship description
   */
  withDescription(description: string): Relationship {
    return new Relationship(
      this.id,
      this.sourceId,
      this.targetId,
      this.type,
      this.communityId,
      description,
      this.strength,
      this.documentSources,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Updates the document sources that support this relationship
   */
  withDocumentSources(documentSources: string[]): Relationship {
    return new Relationship(
      this.id,
      this.sourceId,
      this.targetId,
      this.type,
      this.communityId,
      this.description,
      this.strength,
      documentSources,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Adds a document source to the relationship
   */
  addDocumentSource(documentId: string): Relationship {
    const currentSources = this.documentSources || [];
    if (!currentSources.includes(documentId)) {
      return this.withDocumentSources([...currentSources, documentId]);
    }
    return this;
  }

  /**
   * Strengthens the relationship by increasing its strength
   */
  strengthen(increment: number = 0.1): Relationship {
    const newStrength = Math.min(1.0, this.strength + increment);
    return this.withStrength(newStrength);
  }

  /**
   * Weakens the relationship by decreasing its strength
   */
  weaken(decrement: number = 0.1): Relationship {
    const newStrength = Math.max(0.0, this.strength - decrement);
    return this.withStrength(newStrength);
  }

  /**
   * Checks if the relationship is strong (above threshold)
   */
  isStrong(threshold: number = 0.7): boolean {
    return this.strength >= threshold;
  }

  /**
   * Checks if the relationship is weak (below threshold)
   */
  isWeak(threshold: number = 0.3): boolean {
    return this.strength <= threshold;
  }

  /**
   * Checks if the relationship has a description
   */
  hasDescription(): boolean {
    return Boolean(this.description && this.description.trim().length > 0);
  }

  /**
   * Checks if the relationship has document sources
   */
  hasDocumentSources(): boolean {
    return Boolean(this.documentSources && this.documentSources.length > 0);
  }

  /**
   * Gets the number of supporting documents
   */
  getDocumentSourceCount(): number {
    return this.documentSources?.length || 0;
  }

  /**
   * Checks if this relationship is bidirectional
   */
  isBidirectional(): boolean {
    return [RelationshipType.SIMILAR_TO, RelationshipType.RELATED_TO].includes(
      this.type,
    );
  }

  /**
   * Gets the inverse relationship type if applicable
   */
  getInverseType(): RelationshipType | null {
    switch (this.type) {
      case RelationshipType.IS_A:
        return RelationshipType.CONTAINS;
      case RelationshipType.PART_OF:
        return RelationshipType.CONTAINS;
      case RelationshipType.USES:
        return RelationshipType.ENABLES;
      case RelationshipType.DEPENDS_ON:
        return RelationshipType.ENABLES;
      case RelationshipType.OPPOSITE_OF:
        return RelationshipType.OPPOSITE_OF;
      case RelationshipType.SIMILAR_TO:
        return RelationshipType.SIMILAR_TO;
      case RelationshipType.RELATED_TO:
        return RelationshipType.RELATED_TO;
      default:
        return null;
    }
  }

  /**
   * Creates the inverse relationship
   */
  createInverse(newId: string): Relationship | null {
    const inverseType = this.getInverseType();
    if (!inverseType) {
      return null;
    }

    return new Relationship(
      newId,
      this.targetId,
      this.sourceId,
      inverseType,
      this.communityId,
      this.description,
      this.strength,
      this.documentSources,
    );
  }
}

export enum RelationshipType {
  IS_A = 'IS_A',
  PART_OF = 'PART_OF',
  USES = 'USES',
  IMPLEMENTS = 'IMPLEMENTS',
  EXTENDS = 'EXTENDS',
  DEPENDS_ON = 'DEPENDS_ON',
  SIMILAR_TO = 'SIMILAR_TO',
  OPPOSITE_OF = 'OPPOSITE_OF',
  CAUSES = 'CAUSES',
  ENABLES = 'ENABLES',
  REQUIRES = 'REQUIRES',
  CONTAINS = 'CONTAINS',
  RELATED_TO = 'RELATED_TO',
  OTHER = 'OTHER',
}
