import { Injectable, Inject } from '@nestjs/common';
import { DEEPSEEK_PORT } from 'src/modules/deepseek/tokens';
import type { DeepseekPort } from 'src/modules/deepseek/domain/ports/deepseek.port';
import { Question, QuestionType, QuestionStatus } from '../../domain/entities/question.entity';
import type { QuestionRepositoryPort } from '../../domain/ports/question-repository.port';

@Injectable()
export class DeepseekQuestionAdapter implements QuestionRepositoryPort {
  constructor(@Inject(DEEPSEEK_PORT) private readonly deepseek: DeepseekPort) {}

  async save(question: Question): Promise<Question> {
    return question;
  }

  async findById(id: string): Promise<Question | null> {
    return null;
  }

  async findAll(): Promise<Question[]> {
    return [];
  }

  async findByStatus(status: string, limit = 10, offset = 0): Promise<Question[]> {
    return [];
  }

  async generateQuestion(topic: string): Promise<Question> {
    const response = await this.deepseek.generateQuestion(topic);
    return Question.create(response.question, 'open_analysis', []);
  }
}
