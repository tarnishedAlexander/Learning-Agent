import { Inject, Injectable } from "@nestjs/common";
import { CLASSES_REPO, ENROLLMENT_REPO } from "../../tokens";
import type { ClassesRepositoryPort } from "../../domain/ports/classes.repository.ports";
import type { EnrollmentRepositoryPort } from "../../domain/ports/enrollment.repository.ports";
import { Classes } from "../../domain/entities/classes.entity";

@Injectable()
export class UpdateClassUseCase {
    constructor(
        @Inject(CLASSES_REPO) private readonly classRepo: ClassesRepositoryPort,
        @Inject(ENROLLMENT_REPO) private readonly enrollmentRepo: EnrollmentRepositoryPort,
    ) { }

    async execute(input: {
        teacherId: string, classId: string, name: string,
        semester : string, dateBegin: Date, dateEnd: Date
    }): Promise<Classes> {

        const ojbClass = await this.classRepo.findById(input.classId)
        if (!ojbClass) throw new Error(`Class not found with id ${input.classId}`)

        if (ojbClass.teacherId != input.teacherId) {
            throw new Error(`Class ${ojbClass.id}-${ojbClass.name} doesnt belongs to teacher ${input.teacherId}`)
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