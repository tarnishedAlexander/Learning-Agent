import { Inject, Injectable } from "@nestjs/common";
import { ENROLLMENT_REPO, STUDENT_REPO, USER_REPO } from "../../tokens";
import type { EnrollmentRepositoryPort } from "../../domain/ports/enrollment.repository.ports";
import type { StudentRepositoryPort } from "../../domain/ports/student.repository.ports";
import type { UserRepositoryPort } from "../../domain/ports/user.repository.ports";
import { UserInfoDTO } from "./response_dtos/UserInfo.dto";

@Injectable()
export class GetStudentsByClassUseCase {
    constructor(
        @Inject(ENROLLMENT_REPO) private readonly enrollmentRepo: EnrollmentRepositoryPort,
        @Inject(STUDENT_REPO) private readonly studentRepo: StudentRepositoryPort,
        @Inject(USER_REPO) private readonly userRepo: UserRepositoryPort,
    ) {}

    async execute(classId: string): Promise<UserInfoDTO[]> {
        const enrollmentIDs =  await this.enrollmentRepo.findByClassId(classId);
        const students = await this.findStudents(enrollmentIDs);
        return students;
    }

    async findStudents(enrollmentIDs: any[]): Promise<UserInfoDTO[]> {
        const students: UserInfoDTO[] = [];
        for (const enrollment of enrollmentIDs) {
            const student = await this.studentRepo.findByUserId(enrollment.studentId);
            if (!student) continue;

            const user = await this.userRepo.findById(student.userId);
            if (!user) continue;

            const studentInfo = new UserInfoDTO(
                user.id,
                student.code,
                user.name,
                user.lastname,
                user.email,
                user.isActive,
                student.career,
                student.admissionYear
            );
            if (studentInfo) students.push(studentInfo);
        }

        return students;
    }
}