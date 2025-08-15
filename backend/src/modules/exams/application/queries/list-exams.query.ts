import { Inject } from '@nestjs/common';
import { EXAM_REPO } from '../../tokens';
import type { ExamRepositoryPort } from '../../domain/ports/exam.repository.port';

export class ListExamsQuery {}

export class ListExamsQueryHandler {
  constructor(
    @Inject(EXAM_REPO) private readonly repo: ExamRepositoryPort,
  ) {}

  async execute() {
    // En el futuro implementas list() en el repositorio
    return [];
  }
}
