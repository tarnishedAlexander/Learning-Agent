import { Inject, Injectable } from '@nestjs/common';
import {USER_REPO} from '../../tokens';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.ports';
import {User} from '../../domain/entities/user.entity'

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPO) private readonly userRepo: UserRepositoryPort,
  ) {}
    async execute(input: {
      name: string,
      lastname: string,
      email: string,
      password: string,
      isActive?: boolean,
  }): Promise<User> {
    return this.userRepo.create(
      input.name,
      input.lastname,
      input.email,
      input.password,
      input.isActive,
    );
  }
}
