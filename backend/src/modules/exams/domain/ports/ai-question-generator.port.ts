import { Question } from '../entities/question.entity';
import type { Distribution } from '../entities/distribution.vo';

export interface AIQuestionGeneratorPort {
  generate(params: {
    subject: string;
    difficulty: 'fácil' | 'medio' | 'difícil';
    totalQuestions: number;
    reference?: string | null;
    preferredType?: 'open' | 'multiple_choice' | 'mixed';
    distribution?: Distribution;
  }): Promise<Question[]>;
}