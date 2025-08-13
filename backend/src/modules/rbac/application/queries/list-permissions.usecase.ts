import { Inject, Injectable } from '@nestjs/common';
import { PERM_REPO } from '../../tokens';
import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';

@Injectable()
export class ListPermissionsUseCase {
  constructor(
    @Inject(PERM_REPO) private readonly permRepo: PermissionRepositoryPort,
  ) {}
  execute() {
    return this.permRepo.list();
  }
}
