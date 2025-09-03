import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { QuestionRepositoryPort } from '../../domain/ports/question-repository.port';
import { Question } from '../../domain/entities/question';

@Injectable()
export class PrismaQuestionRepositoryAdapter implements QuestionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async save(question: Question): Promise<Question> {
    const created = await this.prisma.question.create({
      data: {
        id: question.id,
        content: question.content,
        createdAt: question.createdAt,
      },
    });
    return new Question(created.id, created.content, created.createdAt);
  }

  async findById(id: string): Promise<Question | null> {
    const found = await this.prisma.question.findUnique({ where: { id } });
    return found ? new Question(found.id, found.content, found.createdAt) : null;
  }

  async findAll(): Promise<Question[]> {
    const all = await this.prisma.question.findMany();
    return all.map(
      (q) => new Question(q.id, q.content, q.createdAt),
    );
  }
}
