import { Inject, Injectable } from "@nestjs/common";
import { TEACHER_REPO, USER_REPO } from "../../tokens";
import type { UserRepositoryPort } from "../../domain/ports/user.repository.ports";
import type { ProfessorRepositoryPort } from "../../domain/ports/teacher.repository.ports";
import { TeacherInfoDTO } from "../../infrastructure/http/dtos/response.teacher-info.dto";

@Injectable()
export class GetTeacherInfoByIDUseCase {
    constructor(
        @Inject(USER_REPO) private readonly userRepo: UserRepositoryPort,
        @Inject(TEACHER_REPO) private readonly teacherRepo: ProfessorRepositoryPort
    ){}

    async execute(teacherID: string): Promise<TeacherInfoDTO> {
        const teacher = await this.teacherRepo.findByUserId(teacherID);
        if (!teacher) throw new Error(`Teacher not found with ID ${teacherID}`);

        const user = await this.userRepo.findById(teacher.userId);
        if (!user) throw new Error(`User not found with ID ${teacher.userId}`);

        const data = {
            userId: teacher.userId,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            isActive: user.isActive,
            academicUnit: teacher.academicUnit,
            title: teacher.title,
            bio: teacher.bio
        }

        return data;
    }
}