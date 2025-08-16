import { Question } from '../entities/question.entity';

export interface AIQuestionGeneratorPort {
  generate(params: {
    subject: string;
    difficulty: 'fácil' | 'medio' | 'difícil';
    totalQuestions: number;
    reference?: string | null;
    preferredType?: 'open' | 'multiple_choice' | 'mixed';
  }): Promise<Question[]>;
}
