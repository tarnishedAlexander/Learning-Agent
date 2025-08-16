import { Inject, Injectable } from "@nestjs/common";
import { ENROLLMENT_REPO, STUDENT_REPO } from "../../tokens";
import type { EnrollmentRepositoryPort } from "../../domain/ports/enrollment.repository.ports";
import type { StudentRepositoryPort } from "../../domain/ports/student.repository.ports";
import { Student } from "../../domain/entities/student.entity";

@Injectable()
export class GetStudentsByClassUseCase {
    constructor(
        @Inject(ENROLLMENT_REPO) private readonly enrollmentRepo: EnrollmentRepositoryPort,
        @Inject(STUDENT_REPO) private readonly studentRepo: StudentRepositoryPort,
    ) {}

    async execute(classId: string): Promise<Student[]> {
        const enrollmentIDs =  await this.enrollmentRepo.findByClassId(classId);
        const students = await this.findStudents(enrollmentIDs);
        return students;
    }

    async findStudents(enrollmentIDs: any[]): Promise<Student[]> {
        const students: Student[] = [];
        for (const enrollment of enrollmentIDs) {
            const student = await this.studentRepo.findByUserId(enrollment.studentId);
            if (student) students.push(student);
        }
        return students;
    }
}