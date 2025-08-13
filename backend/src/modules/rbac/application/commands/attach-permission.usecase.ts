import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPO, PERM_REPO } from '../../tokens';
import type { RoleRepositoryPort } from '../../domain/ports/role.repository.port';
import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';

@Injectable()
export class AttachPermissionUseCase {
  constructor(
    @Inject(ROLE_REPO) private readonly roleRepo: RoleRepositoryPort,
    @Inject(PERM_REPO) private readonly permRepo: PermissionRepositoryPort,
  ) {}
  async execute(input: { roleId: string; permissionId: string }) {
    const [role, perm] = await Promise.all([
      this.roleRepo.findById(input.roleId),
      this.permRepo.findById(input.permissionId),
    ]);
    if (!role) throw new Error('Role not found');
    if (!perm) throw new Error('Permission not found');
    await this.roleRepo.attachPermission(input.roleId, input.permissionId);
    return { ok: true };
  }
}
