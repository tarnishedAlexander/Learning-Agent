export class DocumentCategoryMapping {
  constructor(
    public readonly documentId: string,
    public readonly categoryId: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(
    documentId: string,
    categoryId: string,
  ): DocumentCategoryMapping {
    return new DocumentCategoryMapping(documentId, categoryId, new Date());
  }

  /**
   * Crea una clave única para el mapping
   */
  getUniqueKey(): string {
    return `${this.documentId}-${this.categoryId}`;
  }

  /**
   * Verifica si el mapping es válido
   */
  isValid(): boolean {
    return !!(
      this.documentId &&
      this.documentId.trim().length > 0 &&
      this.categoryId &&
      this.categoryId.trim().length > 0
    );
  }

  /**
   * Convierte a objeto plano para respuestas JSON
   */
  toJSON() {
    return {
      documentId: this.documentId,
      categoryId: this.categoryId,
      createdAt: this.createdAt,
    };
  }
}
