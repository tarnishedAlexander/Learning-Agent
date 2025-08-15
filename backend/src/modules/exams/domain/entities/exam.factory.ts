import { Exam } from '../entities/exam.entity';
import { Difficulty } from '../entities/difficulty.vo';
import { PositiveInt } from '../entities/positive-int.vo';
import { DomainError } from '../entities/domain-error';
import { randomUUID } from 'crypto';

export type ExamProps = {
  subject: string;
  difficulty: string;
  attempts: number;
  totalQuestions: number;
  timeMinutes: number;
  reference?: string | null;
};

export class ExamFactory {
  static create(props: ExamProps): Exam {
    const subject = props.subject?.trim();
    if (!subject) {
      throw new DomainError('Materia (subject) es obligatoria y no puede estar vacía.');
    }

    // Si quieres limitar caracteres “prohibidos” en referencia:
    const reference = props.reference?.trim();
    if (reference && /[<>]/.test(reference)) {
      throw new DomainError('Referencia contiene caracteres no permitidos.');
    }

    const difficulty = Difficulty.create(props.difficulty);
    const attempts = PositiveInt.create('Intentos', props.attempts);
    const totalQuestions = PositiveInt.create('Total de preguntas', props.totalQuestions);
    const timeMinutes = PositiveInt.create('Tiempo (min)', props.timeMinutes);

    return new Exam(
      randomUUID(),
      subject,
      difficulty,
      attempts,
      totalQuestions,
      timeMinutes,
      reference ?? null,
    );
  }
}
