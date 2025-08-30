import { ExamQuestion, NewExamQuestion } from '../entities/exam-question.entity';

export type InsertPosition = 'start' | 'middle' | 'end';

export interface ExamQuestionRepositoryPort {
  existsExam(examId: string): Promise<boolean>;
  countByExam(examId: string): Promise<number>;
  addToExam(
    examId: string,
    question: NewExamQuestion,
    position: InsertPosition
  ): Promise<ExamQuestion>;
}
