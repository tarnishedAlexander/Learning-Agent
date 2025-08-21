import { User } from '../entities/user.entity';

export interface UserRepositoryPort {
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}
