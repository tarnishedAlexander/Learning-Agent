import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { ExamRepositoryPort } from '../../domain/ports/exam.repository.port';
import { Exam } from '../../domain/entities/exam.entity';
import { Difficulty } from '../../domain/entities/difficulty.vo';
import { PositiveInt } from '../../domain/entities/positive-int.vo';
import { DistributionVO } from '../../domain/entities/distribution.vo';

@Injectable()
export class ExamPrismaRepository implements ExamRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(exam: Exam): Promise<Exam> {
    const row = await this.prisma.exam.create({
      data: {
        id: exam.id,
        subject: exam.subject,
        difficulty: exam.difficulty.getValue(),
        attempts: exam.attempts.getValue(),
        totalQuestions: exam.totalQuestions.getValue(),
        timeMinutes: exam.timeMinutes.getValue(),
        reference: exam.reference ?? null,

        mcqCount:          exam.distribution?.value.multiple_choice ?? 0,
        trueFalseCount:    exam.distribution?.value.true_false ?? 0,
        openAnalysisCount: exam.distribution?.value.open_analysis ?? 0,
        openExerciseCount: exam.distribution?.value.open_exercise ?? 0,

        createdAt: exam.createdAt,
        approvedAt: exam.approvedAt ?? null,
      },
    });

    const sum =
      row.mcqCount +
      row.trueFalseCount +
      row.openAnalysisCount +
      row.openExerciseCount;

    const distVO =
      sum > 0
        ? new DistributionVO(
            {
              multiple_choice: row.mcqCount,
              true_false: row.trueFalseCount,
              open_analysis: row.openAnalysisCount,
              open_exercise: row.openExerciseCount,
            },
            row.totalQuestions,
          )
        : null;

    return new Exam(
      row.id,
      row.subject,
      Difficulty.create(row.difficulty),
      PositiveInt.create('Intentos', row.attempts),
      PositiveInt.create('Total de preguntas', row.totalQuestions),
      PositiveInt.create('Tiempo (min)', row.timeMinutes),
      row.reference ?? null,
      distVO,     
      row.createdAt,
      row.updatedAt,
      row.approvedAt ?? undefined,
    );
  }

  async findById(id: string): Promise<Exam | null> {
    const row = await this.prisma.exam.findUnique({ where: { id } });
    if (!row) return null;

    const sum =
      row.mcqCount +
      row.trueFalseCount +
      row.openAnalysisCount +
      row.openExerciseCount;

    const distVO =
      sum > 0
        ? new DistributionVO(
            {
              multiple_choice: row.mcqCount,
              true_false: row.trueFalseCount,
              open_analysis: row.openAnalysisCount,
              open_exercise: row.openExerciseCount,
            },
            row.totalQuestions,
          )
        : null;

    return new Exam(
      row.id,
      row.subject,
      Difficulty.create(row.difficulty),
      PositiveInt.create('Intentos', row.attempts),
      PositiveInt.create('Total de preguntas', row.totalQuestions),
      PositiveInt.create('Tiempo (min)', row.timeMinutes),
      row.reference ?? null,
      distVO,
      row.createdAt,
      row.updatedAt,
      row.approvedAt ?? undefined, 
    );
  }

  async approve(id: string): Promise<void> {
    const row = await this.prisma.exam.findUnique({ where: { id } });
    if (!row) throw new Error('Exam not found');
    if (row.approvedAt) throw new Error('Exam already approved');
    await this.prisma.exam.update({
      where: { id },
      data: { approvedAt: new Date() },
    });
  }

}