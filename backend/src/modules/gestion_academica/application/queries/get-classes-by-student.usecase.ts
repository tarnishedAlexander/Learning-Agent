import { Inject, Injectable } from "@nestjs/common";
import { ENROLLMENT_REPO, CLASSES_REPO } from "../../tokens";
import type { EnrollmentRepositoryPort } from "../../domain/ports/enrollment.repository.ports";
import type { ClassesRepositoryPort } from "../../domain/ports/classes.repository.ports";
import { Classes } from "../../domain/entities/classes.entity";

@Injectable()
export class GetClassesByStudentUseCase {
    constructor(
        @Inject(ENROLLMENT_REPO) private readonly enrollmentRepo: EnrollmentRepositoryPort,
        @Inject(CLASSES_REPO) private readonly classesRepo: ClassesRepositoryPort,
    ) {}

    async execute(studentId: string): Promise<Classes[]> {
        const enrollmentIDs = await this.enrollmentRepo.findByStudentId(studentId);
        const classes = await this.findClasses(enrollmentIDs);
        return classes;
    }

    async findClasses(enrollmentIDs: any[]): Promise<Classes[]> {
        const classes: Classes[] = [];
        for (const enrollment of enrollmentIDs) {
            const ojbClass = await this.classesRepo.findById(enrollment.classId);
            if (ojbClass?.isActive) classes.push(ojbClass);
        }
        return classes;
    }
}