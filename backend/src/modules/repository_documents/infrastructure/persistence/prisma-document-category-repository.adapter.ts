import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { DocumentCategory } from '../../domain/entities/document-category.entity';
import { DocumentCategoryMapping } from '../../domain/entities/document-category-mapping.entity';
import { DocumentCategoryRepositoryPort } from '../../domain/ports/document-category-repository.port';

/**
 * Adaptador de repositorio para DocumentCategory usando Prisma
 */
@Injectable()
export class PrismaDocumentCategoryRepositoryAdapter
  implements DocumentCategoryRepositoryPort
{
  private readonly logger = new Logger(
    PrismaDocumentCategoryRepositoryAdapter.name,
  );

  constructor(private readonly prisma: PrismaService) {}

  // ============ OPERACIONES PARA CATEGORÍAS ============

  async createCategory(category: DocumentCategory): Promise<DocumentCategory> {
    try {
      const savedCategory = await this.prisma.documentCategory.create({
        data: {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
        },
      });

      this.logger.debug(`Categoría creada: ${category.name}`);
      return this.mapCategoryToDomain(savedCategory);
    } catch (error) {
      this.logger.error(`Error creando categoría ${category.name}:`, error);
      throw new Error(`Error creando categoría: ${error}`);
    }
  }

  async findCategoryById(id: string): Promise<DocumentCategory | null> {
    try {
      const category = await this.prisma.documentCategory.findUnique({
        where: { id },
      });

      return category ? this.mapCategoryToDomain(category) : null;
    } catch (error) {
      this.logger.error(`Error buscando categoría por ID ${id}:`, error);
      throw new Error(`Error buscando categoría: ${error}`);
    }
  }

  async findCategoryByName(name: string): Promise<DocumentCategory | null> {
    try {
      const category = await this.prisma.documentCategory.findUnique({
        where: { name },
      });

      return category ? this.mapCategoryToDomain(category) : null;
    } catch (error) {
      this.logger.error(`Error buscando categoría por nombre ${name}:`, error);
      throw new Error(`Error buscando categoría por nombre: ${error}`);
    }
  }

  async findAllCategories(): Promise<DocumentCategory[]> {
    try {
      const categories = await this.prisma.documentCategory.findMany({
        orderBy: { name: 'asc' },
      });

      return categories.map((category) => this.mapCategoryToDomain(category));
    } catch (error) {
      this.logger.error('Error listando todas las categorías:', error);
      throw new Error(`Error listando categorías: ${error}`);
    }
  }

  async updateCategory(
    id: string,
    updates: Partial<DocumentCategory>,
  ): Promise<DocumentCategory | null> {
    try {
      const updatedCategory = await this.prisma.documentCategory.update({
        where: { id },
        data: {
          name: updates.name,
          description: updates.description,
          color: updates.color,
          icon: updates.icon,
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`Categoría actualizada: ${id}`);
      return this.mapCategoryToDomain(updatedCategory);
    } catch (error) {
      if (error.code === 'P2025') {
        return null; // Categoría no encontrada
      }
      this.logger.error(`Error actualizando categoría ${id}:`, error);
      throw new Error(`Error actualizando categoría: ${error}`);
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await this.prisma.documentCategory.delete({
        where: { id },
      });

      this.logger.debug(`Categoría eliminada: ${id}`);
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        return false; // Categoría no encontrada
      }
      this.logger.error(`Error eliminando categoría ${id}:`, error);
      throw new Error(`Error eliminando categoría: ${error}`);
    }
  }

  // ============ OPERACIONES PARA MAPPINGS ============

  async assignCategoryToDocument(
    documentId: string,
    categoryId: string,
  ): Promise<DocumentCategoryMapping> {
    try {
      const mapping = await this.prisma.documentCategoryMapping.create({
        data: {
          documentId,
          categoryId,
        },
      });

      this.logger.debug(
        `Categoría ${categoryId} asignada a documento ${documentId}`,
      );
      return this.mapMappingToDomain(mapping);
    } catch (error) {
      // Si ya existe el mapping, devolver el existente
      if (error.code === 'P2002') {
        const existingMapping =
          await this.prisma.documentCategoryMapping.findUnique({
            where: {
              documentId_categoryId: {
                documentId,
                categoryId,
              },
            },
          });

        if (existingMapping) {
          return this.mapMappingToDomain(existingMapping);
        }
      }

      this.logger.error(
        `Error asignando categoría ${categoryId} a documento ${documentId}:`,
        error,
      );
      throw new Error(`Error asignando categoría: ${error}`);
    }
  }

  async removeCategoryFromDocument(
    documentId: string,
    categoryId: string,
  ): Promise<boolean> {
    try {
      await this.prisma.documentCategoryMapping.delete({
        where: {
          documentId_categoryId: {
            documentId,
            categoryId,
          },
        },
      });

      this.logger.debug(
        `Categoría ${categoryId} removida de documento ${documentId}`,
      );
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        return false; // Mapping no encontrado
      }
      this.logger.error(
        `Error removiendo categoría ${categoryId} de documento ${documentId}:`,
        error,
      );
      throw new Error(`Error removiendo categoría: ${error}`);
    }
  }

  async findCategoriesByDocumentId(
    documentId: string,
  ): Promise<DocumentCategory[]> {
    try {
      const mappings = await this.prisma.documentCategoryMapping.findMany({
        where: { documentId },
        include: { category: true },
        orderBy: { category: { name: 'asc' } },
      });

      return mappings.map((mapping) =>
        this.mapCategoryToDomain(mapping.category),
      );
    } catch (error) {
      this.logger.error(
        `Error buscando categorías del documento ${documentId}:`,
        error,
      );
      throw new Error(`Error buscando categorías del documento: ${error}`);
    }
  }

  async findDocumentIdsByCategoryId(categoryId: string): Promise<string[]> {
    try {
      const mappings = await this.prisma.documentCategoryMapping.findMany({
        where: { categoryId },
        select: { documentId: true },
        orderBy: { createdAt: 'desc' },
      });

      return mappings.map((mapping) => mapping.documentId);
    } catch (error) {
      this.logger.error(
        `Error buscando documentos de la categoría ${categoryId}:`,
        error,
      );
      throw new Error(`Error buscando documentos de la categoría: ${error}`);
    }
  }

  async findMappingsByDocumentId(
    documentId: string,
  ): Promise<DocumentCategoryMapping[]> {
    try {
      const mappings = await this.prisma.documentCategoryMapping.findMany({
        where: { documentId },
        orderBy: { createdAt: 'asc' },
      });

      return mappings.map((mapping) => this.mapMappingToDomain(mapping));
    } catch (error) {
      this.logger.error(
        `Error buscando mappings del documento ${documentId}:`,
        error,
      );
      throw new Error(`Error buscando mappings del documento: ${error}`);
    }
  }

  async hasCategory(documentId: string, categoryId: string): Promise<boolean> {
    try {
      const mapping = await this.prisma.documentCategoryMapping.findUnique({
        where: {
          documentId_categoryId: {
            documentId,
            categoryId,
          },
        },
      });

      return !!mapping;
    } catch (error) {
      this.logger.error(
        `Error verificando categoría ${categoryId} en documento ${documentId}:`,
        error,
      );
      return false;
    }
  }

  async replaceDocumentCategories(
    documentId: string,
    categoryIds: string[],
  ): Promise<DocumentCategoryMapping[]> {
    try {
      // Usar transacción para garantizar consistencia
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Eliminar mappings existentes
        await tx.documentCategoryMapping.deleteMany({
          where: { documentId },
        });

        // 2. Crear nuevos mappings
        const newMappings = await Promise.all(
          categoryIds.map((categoryId) =>
            tx.documentCategoryMapping.create({
              data: {
                documentId,
                categoryId,
              },
            }),
          ),
        );

        return newMappings;
      });

      this.logger.log(
        `Categorías reemplazadas para documento ${documentId}. Nuevas categorías: ${categoryIds.length}`,
      );
      return result.map((mapping) => this.mapMappingToDomain(mapping));
    } catch (error) {
      this.logger.error(
        `Error reemplazando categorías del documento ${documentId}:`,
        error,
      );
      throw new Error(`Error reemplazando categorías: ${error}`);
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  /**
   * Mapea una categoría de Prisma a entidad de dominio
   */
  private mapCategoryToDomain(prismaCategory: any): DocumentCategory {
    return new DocumentCategory(
      prismaCategory.id,
      prismaCategory.name,
      prismaCategory.description,
      prismaCategory.color,
      prismaCategory.icon,
      prismaCategory.createdAt,
      prismaCategory.updatedAt,
    );
  }

  /**
   * Mapea un mapping de Prisma a entidad de dominio
   */
  private mapMappingToDomain(prismaMapping: any): DocumentCategoryMapping {
    return new DocumentCategoryMapping(
      prismaMapping.documentId,
      prismaMapping.categoryId,
      prismaMapping.createdAt,
    );
  }
}
