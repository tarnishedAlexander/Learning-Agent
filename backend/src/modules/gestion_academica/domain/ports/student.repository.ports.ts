import { Student } from "../entities/student.entity";
export interface StudentRepositoryPort {
    findByCode(code: number): Promise<Student | null>;
    findByUserId(userId: number): Promise<Student | null>;
    create(
        code: number, 
        userId: string, 
        name: string
    ): Promise<Student>;
    list(): Promise<Student[]>;
}