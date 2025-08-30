import { Classes } from "../entities/classes.entity";
export interface ClassesRepositoryPort {
    findById(id: string): Promise<Classes | null>;
    findByCourseId(courseId: string): Promise<Classes[]>;
    create(
        name: string, 
        semester: string, 
        courseId: string,
        dateBegin: Date,
        dateEnd: Date
    ): Promise<Classes>;
    updateInfo(
        id: string,
        name: string,
        semester: string, 
        dateBegin: Date,
        dateEnd: Date
    ): Promise<Classes>;
    softDelete(
        id: string
    ): Promise<Classes>;
    list(): Promise<Classes[]>;
}