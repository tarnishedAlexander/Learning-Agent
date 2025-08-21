import { Inject, Injectable } from '@nestjs/common';
import {STUDENT_REPO} from '../../tokens';
import type {StudentRepositoryPort } from '../../domain/ports/student.repository.ports';
import {Student} from '../../domain/entities/student.entity'

@Injectable()
export class ListStudentsUseCase {
  constructor(
    @Inject(STUDENT_REPO) private readonly classRepo: StudentRepositoryPort,
  ) {}
  async execute(): Promise<Student[]> {
    return this.classRepo.list();
  }
}
