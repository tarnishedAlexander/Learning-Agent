import { Injectable } from '@nestjs/common';
import type { QuestionRepositoryPort } from '../domain/ports/question-repository.port';
import { Question } from '../domain/entities/question';

@Injectable()
export class PublishGeneratedQuestionUseCase {
  constructor(private readonly questionRepo: QuestionRepositoryPort) {}

  async execute(content: string): Promise<Question> {
    const question = Question.create(content);
    return this.questionRepo.save(question);
  }
}
