import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { QuestionRepositoryPort } from '../../domain/ports/question-repository.port';
import { Question } from '../../../exams/domain/entities/question.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaQuestionRepositoryAdapter implements QuestionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(question: Question): Promise<Question> {
    const created = await this.prisma.examQuestion.create({
      data: {
        id: (question as any).id,
        examId: (question as any).examId as any,
        kind: (question as any).kind as any,
        text: (question as any).text,
        options: ((question as any).options ?? undefined) as unknown as Prisma.InputJsonValue,
        correctOptionIndex: (question as any).correctOptionIndex ?? undefined,
        correctBoolean: (question as any).correctBoolean ?? undefined,
        expectedAnswer: (question as any).expectedAnswer ?? undefined,
        order: (question as any).order as any,
        createdAt: (question as any).createdAt ?? undefined,
        updatedAt: (question as any).updatedAt ?? undefined,
      },
    });

    return new Question(
      (created as any).text,
      (created as any).options as any,
      undefined,
      undefined,
      undefined
    );
  }

  async findById(id: string): Promise<Question | null> {
    const found = await this.prisma.examQuestion.findUnique({ where: { id } });
    return found
      ? new Question(
          (found as any).text,
          (found as any).options as any,
          undefined,
          undefined,
          undefined
        )
      : null;
  }

  async findAll(): Promise<Question[]> {
    const all = await this.prisma.examQuestion.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return all.map(
      q =>
        new Question(
          (q as any).text,
          (q as any).options as any,
          undefined,
          undefined,
          undefined
        )
    );
  }

  async findByStatus(status: string, limit = 10, offset = 0): Promise<Question[]> {
    const all = await this.prisma.examQuestion.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const filtered = all.filter(q => (q as any).status === status);
    const slice = filtered.slice(offset, offset + limit);
    return slice.map(
      q =>
        new Question(
          (q as any).text,
          (q as any).options as any,
          undefined,
          undefined,
          undefined
        )
    );
  }
}
