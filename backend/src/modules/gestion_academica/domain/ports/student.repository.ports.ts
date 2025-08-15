import { Student } from "../entities/student.entity";
export interface StudentRepositoryPort {
    findByUserId(userId: string): Promise<Student | null>;
    findByCode(code: string): Promise<Student | null>;
    create(
        userId: string,
        code: string,
        career?: string,
        admissionYear?: number,
    ): Promise<Student>;
    list(): Promise<Student[]>;
}