import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import type { ExamQuestionRepositoryPort, InsertPosition } from '../../domain/ports/exam-question.repository.port';
import type { ExamQuestion, NewExamQuestion } from '../../domain/entities/exam-question.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExamQuestionPrismaRepository implements ExamQuestionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async existsExam(examId: string): Promise<boolean> {
    const c = await this.prisma.exam.count({ where: { id: examId } });
    return c > 0;
  }

  async countByExam(examId: string): Promise<number> {
    return this.prisma.examQuestion.count({ where: { examId } });
  }

  async addToExam(examId: string, q: NewExamQuestion, position: InsertPosition): Promise<ExamQuestion> {
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.examQuestion.count({ where: { examId } });

      let insertionOrder = 1;
      if (position === 'start') insertionOrder = 1;
      else if (position === 'end') insertionOrder = count + 1;
      else if (position === 'middle') insertionOrder = Math.floor(count / 2) + 1;

      if (insertionOrder <= count) {
        await tx.examQuestion.updateMany({
          where: { examId, order: { gte: insertionOrder } },
          data: { order: { increment: 1 } },
        });
      }

      const created = await tx.examQuestion.create({
        data: {
          examId,
          kind: q.kind as any, // Prisma enum coincide con los strings
          text: q.text,
          options: q.options ? (q.options as unknown as Prisma.InputJsonValue) : undefined,
          correctOptionIndex: q.correctOptionIndex ?? null,
          correctBoolean: q.correctBoolean ?? null,
          expectedAnswer: q.expectedAnswer ?? null,
          order: insertionOrder,
        },
      });

      // sincroniza contadores + totalQuestions en el mismo commit
      const data: Prisma.ExamUpdateArgs['data'] = { totalQuestions: { increment: 1 } };
      if (q.kind === 'MULTIPLE_CHOICE') data.mcqCount = { increment: 1 };
      else if (q.kind === 'TRUE_FALSE') data.trueFalseCount = { increment: 1 };
      else if (q.kind === 'OPEN_ANALYSIS') data.openAnalysisCount = { increment: 1 };
      else if (q.kind === 'OPEN_EXERCISE') data.openExerciseCount = { increment: 1 };

      await tx.exam.update({ where: { id: examId }, data });

      return {
        id: created.id,
        examId: created.examId,
        kind: q.kind,
        text: created.text,
        options: (created as any).options ?? undefined,
        correctOptionIndex: created.correctOptionIndex ?? undefined,
        correctBoolean: created.correctBoolean ?? undefined,
        expectedAnswer: created.expectedAnswer ?? undefined,
        order: created.order,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    });
  }
}