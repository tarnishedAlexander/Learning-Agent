import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RoleRepositoryPort } from '../../domain/ports/role.repository.port';
import { Role } from '../../domain/entities/role.entity';

@Injectable()
export class RolePrismaRepository implements RoleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}
  async listForUser(userId: string): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: { users: { some: { userId: userId } } },
    });
    return roles.map((r) => new Role(r.id, r.name, r.description));
  }
  async findById(id: string) {
    const r = await this.prisma.role.findUnique({ where: { id } });
    return r ? new Role(r.id, r.name, r.description) : null;
  }
  async findByName(name: string) {
    const r = await this.prisma.role.findUnique({ where: { name } });
    return r ? new Role(r.id, r.name, r.description) : null;
  }
  async create(name: string, description?: string | null) {
    const r = await this.prisma.role.create({ data: { name, description } });
    return new Role(r.id, r.name, r.description);
  }
  async list() {
    const rows = await this.prisma.role.findMany({ orderBy: { name: 'asc' } });
    return rows.map((r) => new Role(r.id, r.name, r.description));
  }
  async attachPermission(roleId: string, permissionId: string) {
    await this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      create: { roleId, permissionId },
      update: {},
    });
  }
}
