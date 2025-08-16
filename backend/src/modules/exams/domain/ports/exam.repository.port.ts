import { Exam } from '../entities/exam.entity';

export interface ExamRepositoryPort {
  create(exam: Exam): Promise<Exam>;
  findById(id: string): Promise<Exam | null>;
<<<<<<< HEAD
  // futuros métodos: list, update, etc.
=======
>>>>>>> 7841a111762eccad9e539d780b919f3193ddfb2e
}
