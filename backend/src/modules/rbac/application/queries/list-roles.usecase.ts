import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPO } from '../../tokens';
import type { RoleRepositoryPort } from '../../domain/ports/role.repository.port';

@Injectable()
export class ListRolesUseCase {
  constructor(
    @Inject(ROLE_REPO) private readonly roleRepo: RoleRepositoryPort,
  ) {}
  execute() {
    return this.roleRepo.list();
  }
}
