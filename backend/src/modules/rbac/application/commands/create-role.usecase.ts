import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPO } from '../../tokens';
import type { RoleRepositoryPort } from '../../domain/ports/role.repository.port';
import { Role } from '../../domain/entities/role.entity';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPO) private readonly roleRepo: RoleRepositoryPort,
  ) {}
  async execute(input: {
    name: string;
    description?: string | null;
  }): Promise<Role> {
    if (await this.roleRepo.findByName(input.name))
      throw new Error('Role name already exists');
    return this.roleRepo.create(input.name, input.description ?? null);
  }
}
