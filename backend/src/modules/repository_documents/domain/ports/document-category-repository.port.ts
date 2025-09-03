import type { DocumentCategory } from '../entities/document-category.entity';

/**
 * Puerto para el repositorio de categorías de documentos
 */
export interface DocumentCategoryRepositoryPort {
  /**
   * Busca una categoría por nombre
   */
  findByName(name: string): Promise<DocumentCategory | null>;

  /**
   * Obtiene todas las categorías disponibles
   */
  findAll(): Promise<DocumentCategory[]>;

  /**
   * Busca una categoría por ID
   */
  findById(id: string): Promise<DocumentCategory | null>;

  /**
   * Obtiene las categorías más utilizadas
   */
  findMostUsed(
    limit?: number,
  ): Promise<Array<DocumentCategory & { usageCount: number }>>;
}
