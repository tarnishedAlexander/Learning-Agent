export type QuestionKind =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'OPEN_ANALYSIS'
  | 'OPEN_EXERCISE';

export interface NewExamQuestion {
  kind: QuestionKind;
  text: string;
  options?: string[];          // MCQ
  correctOptionIndex?: number; // MCQ
  correctBoolean?: boolean;    // TRUE_FALSE
  expectedAnswer?: string;     // OPEN_*
}

export interface ExamQuestion extends NewExamQuestion {
  id: string;
  examId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
