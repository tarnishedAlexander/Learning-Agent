import { Difficulty } from '../entities/difficulty.vo';
import { PositiveInt } from '../entities/positive-int.vo';

export class Exam {
  constructor(
    public readonly id: string,
    public subject: string,
    public difficulty: Difficulty,
    public attempts: PositiveInt,
    public totalQuestions: PositiveInt,
    public timeMinutes: PositiveInt,
    public reference?: string | null,
    public readonly createdAt: Date = new Date(),
  ) {}

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      difficulty: this.difficulty.getValue(),
      attempts: this.attempts.getValue(),
      totalQuestions: this.totalQuestions.getValue(),
      timeMinutes: this.timeMinutes.getValue(),
      reference: this.reference ?? null,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
