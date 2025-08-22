import { Inject, Injectable } from "@nestjs/common";
import { ENROLLMENT_REPO, STUDENT_REPO, CLASSES_REPO, USER_REPO } from "../../tokens";
import type { EnrollmentRepositoryPort } from "../../domain/ports/enrollment.repository.ports";
import type { StudentRepositoryPort } from "../../domain/ports/student.repository.ports";
import type { ClassesRepositoryPort } from "../../domain/ports/classes.repository.ports";
import type { UserRepositoryPort } from "../../domain/ports/user.repository.ports";

@Injectable()
export class EnrollSingleStudentUseCase {
    constructor(
        @Inject(ENROLLMENT_REPO) private readonly enrollmentRepo: EnrollmentRepositoryPort,
        @Inject(STUDENT_REPO) private readonly studentRepo: StudentRepositoryPort,
        @Inject(CLASSES_REPO) private readonly classesRepo: ClassesRepositoryPort,
        @Inject(USER_REPO) private readonly userRepo: UserRepositoryPort,
    ) {}

    async execute(input: { studentName: string; studentLastname: string; studentCode: string; classId: string }) {
        let student = await this.studentRepo.findByCode(input.studentCode);
        if (!student) {
            console.log(`Student not found with code ${input.studentCode}, creating new user:`);
            student = await this.handleNewUser(input.studentName, input.studentLastname, input.studentCode);
        }

        const ojbClass = await this.classesRepo.findById(input.classId);
        if (!ojbClass) throw new Error("Class not found");

        const existingEnrollments = await this.enrollmentRepo.findByStudentId(student.userId);
        if (existingEnrollments.some(enrollment => enrollment.classId === input.classId)) {
            throw new Error("Student is already enrolled in this class");
        }

        const enrollment = await this.enrollmentRepo.create(student.userId, input.classId);
        return enrollment;
    }

    async handleNewUser(studentName: string, studentLastname: string, studentCode: string) {
        const newUser = await this.userRepo.create(
            studentName,
            studentLastname,
            `${this.fixedString(studentName)+this.fixedString(studentLastname)}.${studentCode}@upb.edu`,
            `${this.fixedString(studentLastname)+studentCode}`
        );
        if (!newUser) throw new Error("Error creating user");

        const newStudent = await this.studentRepo.create(newUser.id, studentCode);
        if (!newStudent) throw new Error("Error creating student");
        return newStudent;
    }

    fixedString(s: string): string {
        return s.trim().toLowerCase().replace(/\s+/g, '');
    }
}   