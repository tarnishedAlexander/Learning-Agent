import { User } from "../entities/user.entity";

export interface UserRepositoryPort {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(
        name: string,
        lastname: string,
        email: string,
        password: string,
        isActive?: boolean,
    ): Promise<User>;
    update(
        id: string,
        name?: string,
        lastname?: string,
        email?: string,
        password?: string,
        isActive?: boolean,
    ): Promise<User>;
    delete(id: string): Promise<void>;
    list(): Promise<User[]>;
}
