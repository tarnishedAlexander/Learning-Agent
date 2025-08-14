import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { ExamRepositoryPort } from '../../domain/ports/exam.repository.port';
import { Exam } from '../../domain/entities/exam.entity';
import { Difficulty } from '../../domain/entities/difficulty.vo';
import { PositiveInt } from '../../domain/entities/positive-int.vo';

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
        reference: exam.reference,
        createdAt: exam.createdAt,
      },
    });
    return new Exam(
      row.id,
      row.subject,
      Difficulty.create(row.difficulty),
      PositiveInt.create('Intentos', row.attempts),
      PositiveInt.create('Total de preguntas', row.totalQuestions),
      PositiveInt.create('Tiempo (min)', row.timeMinutes),
      row.reference ?? null,
      row.createdAt,
    );
  }

  async findById(id: string): Promise<Exam | null> {
    const row = await this.prisma.exam.findUnique({ where: { id } });
    if (!row) return null;
    return new Exam(
      row.id,
      row.subject,
      Difficulty.create(row.difficulty),
      PositiveInt.create('Intentos', row.attempts),
      PositiveInt.create('Total de preguntas', row.totalQuestions),
      PositiveInt.create('Tiempo (min)', row.timeMinutes),
      row.reference ?? null,
      row.createdAt,
    );
  }
}
