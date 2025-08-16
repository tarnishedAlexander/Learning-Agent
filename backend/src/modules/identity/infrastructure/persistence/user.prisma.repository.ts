import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class UserPrismaRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}
  async findByEmail(email: string): Promise<User | null> {
    const u = await this.prisma.user.findUnique({ where: { email } });
    return u ? new User(u.id, u.email, u.password, u.isActive) : null;
  }
}
