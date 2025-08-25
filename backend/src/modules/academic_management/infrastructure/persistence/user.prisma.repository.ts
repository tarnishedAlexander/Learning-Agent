import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { UserRepositoryPort } from '../../domain/ports/user.repository.ports';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class UserPrismaRepository implements UserRepositoryPort {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return user ? this.toDomain(user) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        return user ? this.toDomain(user) : null;
    }

    async create(
        name: string,
        lastname: string,
        email: string,
        password: string,
        isActive: boolean = true
    ): Promise<User> {
        const user = await this.prisma.user.create({
            data: {
                name,
                lastname,
                email,
                password,
                isActive
            },
        });
        return this.toDomain(user);
    }

    async update(
        id: string,
        name?: string,
        lastname?: string,
        email?: string,
        password?: string,
        isActive?: boolean
    ): Promise<User> {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                name,
                lastname,
                email,
                password,
                isActive
            },
        });
        return this.toDomain(user);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({ where: { id } });
    }

    async list(): Promise<User[]> {
        const users = await this.prisma.user.findMany();
        return users.map(this.toDomain);
    }

    private toDomain(user: any): User {
        return new User(
            user.id,
            user.name,
            user.lastname,
            user.email,
            user.password,
            user.isActive,
            user.createdAt,
            user.updatedAt,
        );
    }
}
