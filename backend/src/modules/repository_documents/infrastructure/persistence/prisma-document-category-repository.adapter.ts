import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import type { DocumentCategoryRepositoryPort } from '../../domain/ports/document-category-repository.port';
import { DocumentCategory } from '../../domain/entities/document-category.entity';

/**
 * Adaptador de Prisma para el repositorio de categorías de documentos
 */
@Injectable()
export class PrismaDocumentCategoryRepositoryAdapter
  implements DocumentCategoryRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca una categoría por nombre
   */
  async findByName(name: string): Promise<DocumentCategory | null> {
    const category = await this.prisma.documentCategory.findUnique({
      where: { name },
    });

    return category ? this.toDomainEntity(category) : null;
  }

  /**
   * Obtiene todas las categorías disponibles
   */
  async findAll(): Promise<DocumentCategory[]> {
    const categories = await this.prisma.documentCategory.findMany({
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => this.toDomainEntity(category));
  }

  /**
   * Busca una categoría por ID
   */
  async findById(id: string): Promise<DocumentCategory | null> {
    const category = await this.prisma.documentCategory.findUnique({
      where: { id },
    });

    return category ? this.toDomainEntity(category) : null;
  }

  /**
   * Obtiene las categorías más utilizadas
   */
  async findMostUsed(
    limit: number = 10,
  ): Promise<Array<DocumentCategory & { usageCount: number }>> {
    const categories = await this.prisma.documentCategory.findMany({
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
      orderBy: {
        documents: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    const result: Array<DocumentCategory & { usageCount: number }> = [];

    for (const category of categories) {
      const domainEntity = this.toDomainEntity(category);
      const entityWithCount = domainEntity as DocumentCategory & {
        usageCount: number;
      };
      entityWithCount.usageCount = (category as any)._count?.documents || 0;
      result.push(entityWithCount);
    }

    return result;
  }

  /**
   * Convierte de modelo de Prisma a entidad de dominio
   */
  private toDomainEntity(prismaCategory: {
    id: string;
    name: string;
    description?: string | null;
    color?: string | null;
    icon?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): DocumentCategory {
    return new DocumentCategory(
      prismaCategory.id,
      prismaCategory.name,
      prismaCategory.description || undefined,
      prismaCategory.color || undefined,
      prismaCategory.icon || undefined,
      prismaCategory.createdAt,
      prismaCategory.updatedAt,
    );
  }
}
