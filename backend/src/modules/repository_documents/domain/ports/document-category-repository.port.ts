import { DocumentCategory } from '../entities/document-category.entity';
import { DocumentCategoryMapping } from '../entities/document-category-mapping.entity';

export interface DocumentCategoryRepositoryPort {
  // ============ OPERACIONES PARA CATEGORÍAS ============

  /**
   * Crea una nueva categoría
   */
  createCategory(category: DocumentCategory): Promise<DocumentCategory>;

  /**
   * Busca una categoría por ID
   */
  findCategoryById(id: string): Promise<DocumentCategory | null>;

  /**
   * Busca una categoría por nombre
   */
  findCategoryByName(name: string): Promise<DocumentCategory | null>;

  /**
   * Lista todas las categorías
   */
  findAllCategories(): Promise<DocumentCategory[]>;

  /**
   * Actualiza una categoría
   */
  updateCategory(
    id: string,
    updates: Partial<DocumentCategory>,
  ): Promise<DocumentCategory | null>;

  /**
   * Elimina una categoría
   */
  deleteCategory(id: string): Promise<boolean>;

  // ============ OPERACIONES PARA MAPPINGS ============

  /**
   * Asigna una categoría a un documento
   */
  assignCategoryToDocument(
    documentId: string,
    categoryId: string,
  ): Promise<DocumentCategoryMapping>;

  /**
   * Remueve una categoría de un documento
   */
  removeCategoryFromDocument(
    documentId: string,
    categoryId: string,
  ): Promise<boolean>;

  /**
   * Obtiene todas las categorías de un documento
   */
  findCategoriesByDocumentId(documentId: string): Promise<DocumentCategory[]>;

  /**
   * Obtiene todos los documentos de una categoría
   */
  findDocumentIdsByCategoryId(categoryId: string): Promise<string[]>;

  /**
   * Obtiene todos los mappings de un documento
   */
  findMappingsByDocumentId(
    documentId: string,
  ): Promise<DocumentCategoryMapping[]>;

  /**
   * Verifica si un documento tiene una categoría específica
   */
  hasCategory(documentId: string, categoryId: string): Promise<boolean>;

  /**
   * Reemplaza todas las categorías de un documento
   */
  replaceDocumentCategories(
    documentId: string,
    categoryIds: string[],
  ): Promise<DocumentCategoryMapping[]>;
}
