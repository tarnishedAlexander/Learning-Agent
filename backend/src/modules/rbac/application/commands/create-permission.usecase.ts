import { Inject, Injectable } from '@nestjs/common';
import { PERM_REPO } from '../../tokens';
import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';

@Injectable()
export class CreatePermissionUseCase {
  constructor(
    @Inject(PERM_REPO) private readonly permRepo: PermissionRepositoryPort,
  ) {}
  async execute(input: {
    action: string;
    resource: string;
    description?: string | null;
  }) {
    const exists = await this.permRepo.findByActionResource(
      input.action,
      input.resource,
    );
    if (exists) throw new Error('Permission already exists');
    return this.permRepo.create(
      input.action,
      input.resource,
      input.description ?? null,
    );
  }
}
