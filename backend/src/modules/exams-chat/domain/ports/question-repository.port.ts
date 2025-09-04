import { Question } from '../entities/question.entity';

export interface QuestionRepositoryPort {
  save(question: Question): Promise<Question>;      
  findById(id: string): Promise<Question | null>;
  findAll(): Promise<Question[]>;                   
  findByStatus(status: string, limit?: number, offset?: number): Promise<Question[]>;
}