import { Professor } from "../entities/professor.entity";
export interface ProfessorRepositoryPort {
    findByCode(code: number): Promise<Professor | null>;
    findByUserId(userId: number): Promise<Professor | null>;
    create(
        code: number,
        userId: number,
        name: string
    ): Promise<Professor>;
    list(): Promise<Professor[]>;
}
