/**
 * Entidad de dominio para categorías de documentos
 */
export class DocumentCategory {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly color?: string,
    public readonly icon?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    name: string,
    description?: string,
    color?: string,
    icon?: string,
  ): DocumentCategory {
    return new DocumentCategory(
      id,
      name,
      description,
      color,
      icon,
      new Date(),
      new Date(),
    );
  }

  /**
   * Verifica si la categoría es válida
   */
  isValid(): boolean {
    return this.name.trim().length > 0;
  }

  /**
   * Obtiene el nombre para mostrar
   */
  getDisplayName(): string {
    return this.name;
  }
}
