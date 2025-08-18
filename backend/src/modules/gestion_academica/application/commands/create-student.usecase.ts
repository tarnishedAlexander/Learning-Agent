import { Inject, Injectable } from '@nestjs/common';
import {STUDENT_REPO} from '../../tokens';
import type { StudentRepositoryPort } from '../../domain/ports/student.repository.ports';
import {Student} from '../../domain/entities/student.entity'

@Injectable()
export class CreateStudentUseCase {
  constructor(
    @Inject(STUDENT_REPO) private readonly studentRepo: StudentRepositoryPort,
  ) {}
    async execute(input: {
    userId: string,
    code: string,
    career?: string,
    admissionYear?: number
  }): Promise<Student> {
    return this.studentRepo.create(
      input.userId,
      input.code,
      input.career,
      input.admissionYear
    );
  }
}
