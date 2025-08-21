import { Inject, Injectable } from "@nestjs/common";
import { ENROLLMENT_REPO, STUDENT_REPO, CLASSES_REPO } from "../../tokens";
import type { EnrollmentRepositoryPort } from "../../domain/ports/enrollment.repository.ports";
import type { StudentRepositoryPort } from "../../domain/ports/student.repository.ports";
import type { ClassesRepositoryPort } from "../../domain/ports/classes.repository.ports";

@Injectable()
export class CreateEnrollmentUseCase {
    constructor(
        @Inject(ENROLLMENT_REPO) private readonly enrollmentRepo: EnrollmentRepositoryPort,
        @Inject(STUDENT_REPO) private readonly studentRepo: StudentRepositoryPort,
        @Inject(CLASSES_REPO) private readonly classesRepo: ClassesRepositoryPort,
    ) {}

    async execute(input: { studentId: string; classId: string }) {
        const [student, ojbClass] = await Promise.all([
            this.studentRepo.findByUserId(input.studentId),
            this.classesRepo.findById(input.classId),
        ]);
        if (!student) throw new Error("Student not found");
        if (!ojbClass) throw new Error("Class not found");

        const existingEnrollments = await this.enrollmentRepo.findByStudentId(input.studentId);
        if (existingEnrollments.some(enrollment => enrollment.classId === input.classId)) {
            throw new Error("Student is already enrolled in this class");
        }

        const enrollment = await this.enrollmentRepo.create(input.studentId, input.classId);
        return enrollment;
    }
}