import { Inscription } from "../entities/inscription.entity";
export interface InscriptionRepositoryPort {
    findByStudentCode(studentCode: number): Promise<Inscription[]>;
    findByClassId(classId: number): Promise<Inscription[]>;
    create(
        studentCode: number,
        classId: number,
    ): Promise<Inscription>;
    list(): Promise<Inscription[]>;
}