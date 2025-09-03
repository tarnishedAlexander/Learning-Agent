import { Question } from '../entities/question';

export interface QuestionRepositoryPort {
  save(question: Question): Promise<Question>;
  findById(id: string): Promise<Question | null>;
  findAll(): Promise<Question[]>;
}
