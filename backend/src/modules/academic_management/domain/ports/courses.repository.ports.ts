import { Course } from "../entities/course.entity";
export interface CourseRepositoryPort {
    findById(id: string): Promise<Course | null>;
    findByTeacherId(id: string): Promise<Course[]>;
    create (
        name: string,
        teacherId: string
    ): Promise<Course>;
    softDelete(
        id: string
    ): Promise<Course>;
    list(): Promise<Course[]>
}