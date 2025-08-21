import { Injectable } from '@nestjs/common';
import type { AuthorizationPort } from '../../domain/ports/authorization.port';
import { GetRolesForUserUseCase } from '../../../rbac/application/queries/get-roles-for-user.usecase';

@Injectable()
export class RbacAuthzAdapter implements AuthorizationPort {
  constructor(private readonly rbacQuery: GetRolesForUserUseCase) {}

  async getRolesForUser(userId: string): Promise<string[]> {
    const roles = await this.rbacQuery.execute({ userId });
    return roles.map((r) => r.name);
  }
}
