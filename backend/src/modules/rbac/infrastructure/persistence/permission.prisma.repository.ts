import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';
import { Permission } from '../../domain/entities/permission.entity';

@Injectable()
export class PermissionPrismaRepository implements PermissionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string) {
    const p = await this.prisma.permission.findUnique({ where: { id } });
    return p ? new Permission(p.id, p.action, p.resource, p.description) : null;
  }
  async findByActionResource(action: string, resource: string) {
    const p = await this.prisma.permission.findUnique({
      where: { action_resource: { action, resource } },
    });
    return p ? new Permission(p.id, p.action, p.resource, p.description) : null;
  }
  async create(action: string, resource: string, description?: string | null) {
    const p = await this.prisma.permission.create({
      data: { action, resource, description },
    });
    return new Permission(p.id, p.action, p.resource, p.description);
  }
  async list() {
    const rows = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
    return rows.map(
      (p) => new Permission(p.id, p.action, p.resource, p.description),
    );
  }
}
