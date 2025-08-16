import { Inject } from '@nestjs/common';
import { EXAM_REPO } from '../../tokens';
import type { ExamRepositoryPort } from '../../domain/ports/exam.repository.port';
import { ExamFactory } from '../../domain/entities/exam.factory';

// 📌 DTO de aplicación: los datos que se reciben para crear un examen
export class CreateExamCommand {
  constructor(
    public readonly subject: string,
    public readonly difficulty: string,
    public readonly attempts: number,
    public readonly totalQuestions: number,
    public readonly timeMinutes: number,
    public readonly reference?: string | null,
  ) {}
}

// 📌 Handler: ejecuta el caso de uso asociado al comando
export class CreateExamCommandHandler {
  constructor(
    @Inject(EXAM_REPO) private readonly repo: ExamRepositoryPort,
  ) {}

  async execute(command: CreateExamCommand) {
    const exam = ExamFactory.create({
      subject: command.subject,
      difficulty: command.difficulty,
      attempts: command.attempts,
      totalQuestions: command.totalQuestions,
      timeMinutes: command.timeMinutes,
      reference: command.reference,
    });

    return this.repo.create(exam);
  }
}
