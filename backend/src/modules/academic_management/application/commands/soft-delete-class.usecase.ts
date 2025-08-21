import { Inject, Injectable } from "@nestjs/common";
import { CLASSES_REPO, ENROLLMENT_REPO } from "../../tokens";
import type { ClassesRepositoryPort } from "../../domain/ports/classes.repository.ports";
import type { EnrollmentRepositoryPort } from "../../domain/ports/enrollment.repository.ports";
import { Classes } from "../../domain/entities/classes.entity";

@Injectable()
export class SoftDeleteClassUseCase {
    constructor(
        @Inject(CLASSES_REPO) private readonly classRepo: ClassesRepositoryPort,
        @Inject(ENROLLMENT_REPO) private readonly enrollmentRepo: EnrollmentRepositoryPort
    ){}

    async execute(input: {teacherId: string, classId: string}): Promise<Classes> {
        const objClass = await this.classRepo.findById(input.classId)
        if (!objClass) throw new Error(`Class not found with id ${input.classId}`);
        
        if (objClass.teacherId != input.teacherId) {
            throw new Error(`Class ${objClass.id}-${objClass.name} doesnt belongs to teacher ${input.teacherId}`)
        }

        const pendingEnrollments = await this.enrollmentRepo.findByClassId(input.classId)
        if (pendingEnrollments.length > 0) {
            throw new Error(`Class ${objClass.id}-${objClass.name} has pending enrollments`)
        }

        return this.classRepo.softDelete(input.classId)
    }
}