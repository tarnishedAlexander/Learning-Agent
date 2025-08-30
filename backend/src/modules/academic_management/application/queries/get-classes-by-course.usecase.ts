import { Inject, Injectable } from "@nestjs/common";
import { CLASSES_REPO, COURSE_REPO } from "../../tokens";
import type { ClassesRepositoryPort } from "../../domain/ports/classes.repository.ports";
import type { CourseRepositoryPort } from "../../domain/ports/courses.repository.ports";
import { Classes } from "../../domain/entities/classes.entity";
import { NotFoundError } from "src/shared/handler/errors";

@Injectable()
export class GetClassesByCourseUseCase {
    constructor(
        @Inject(CLASSES_REPO) private readonly classesRepo: ClassesRepositoryPort,
        @Inject(COURSE_REPO) private readonly courseRepo: CourseRepositoryPort
    ) {}

    async execute(courseId: string): Promise<Classes[]> {
        // Verificar que el curso existe
        const course = await this.courseRepo.findById(courseId);
        if (!course) {
            throw new NotFoundError(`No Course with ID ${courseId}`);
        }

        return this.classesRepo.findByCourseId(courseId);
    }
}
