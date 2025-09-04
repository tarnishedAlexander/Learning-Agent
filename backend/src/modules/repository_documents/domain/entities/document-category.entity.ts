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
    return !!(this.name && this.name.trim().length > 0);
  }

  /**
   * Convierte a objeto plano para respuestas JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      color: this.color,
      icon: this.icon,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
