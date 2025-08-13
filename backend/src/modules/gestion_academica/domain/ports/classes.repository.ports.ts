import { Classes } from "../entities/classes.entity";
export interface ClassesRepositoryPort {
    findById(id: number): Promise<Classes | null>;
    findByProfessorCode(professorCode: number): Promise<Classes[]>;
    create(
        name: string, 
        semester: string, 
        professorCode: number,
        dateBegin?: Date,
        dateEnd?: Date
    ): Promise<Classes>;
    list(): Promise<Classes[]>;
}