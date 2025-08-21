import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPO } from '../../tokens';
import type { RoleRepositoryPort } from '../../domain/ports/role.repository.port';

@Injectable()
export class GetRolesForUserUseCase {
  constructor(@Inject(ROLE_REPO) private readonly roles: RoleRepositoryPort) {}

  execute(input: { userId: string }) {
    return this.roles.listForUser(input.userId);
  }
}
