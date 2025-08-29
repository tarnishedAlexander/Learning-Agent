import { Inject, Injectable } from "@nestjs/common";
import { CLASSES_REPO, COURSE_REPO } from "../../tokens";
import type { ClassesRepositoryPort } from "../../domain/ports/classes.repository.ports";
import type { CourseRepositoryPort } from "../../domain/ports/courses.repository.ports";
import { Classes } from "../../domain/entities/classes.entity";
import { ForbiddenError, NotFoundError } from "src/shared/handler/errors";

@Injectable()
export class UpdateClassUseCase {
    constructor(
        @Inject(CLASSES_REPO) private readonly classRepo: ClassesRepositoryPort,
        @Inject(COURSE_REPO) private readonly courseRepo: CourseRepositoryPort,
    ) { }

    async execute(input: {
        teacherId: string, classId: string, name: string,
        semester : string, dateBegin: Date, dateEnd: Date
    }): Promise<Classes> {

        const objClass = await this.classRepo.findById(input.classId)
        if (!objClass) {
            throw new NotFoundError(`Class not found with id ${input.classId}`)
        }

        const course = await this.courseRepo.findById(objClass.courseId)
        if (!course) {
            throw new NotFoundError(`Course not found with id ${objClass.courseId}`)
        }
            
        if (course.teacherId != input.teacherId) {
            throw new ForbiddenError(`Class ${objClass.id}-${objClass.name} doesnt belongs to teacher ${input.teacherId}`)
        }
        
        return this.classRepo.updateInfo(
            input.classId,
            input.name,
            input.semester,
            input.dateBegin,
            input.dateEnd
        );
    }
}